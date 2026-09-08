import json
import time
import numpy as np
import logging
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from pipeline.data.extractor       import extraer_equipos_activos, get_responsable
from pipeline.features.engineer    import construir_features_desde_resumen, FEATURE_COLS
from pipeline.explainability.explainer import calcular_shap_equipo, generar_explicacion_texto
from pipeline.registry.model_registry import cargar_modelo, modelo_existe, get_version_activa
from api.routes.entrenamiento      import _pipeline_completo
from database import execute_insert, execute_query, execute_update
from config import (
    UMBRAL_RIESGO_ALTO, UMBRAL_RIESGO_MEDIO,
    UMBRAL_ORDEN_AUTO,  UMBRAL_NOTIFICACION
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _nivel_riesgo(prob: float) -> str:
    if prob >= 0.85:                return "CRÍTICO"
    if prob >= UMBRAL_RIESGO_ALTO:  return "ALTO"
    if prob >= UMBRAL_RIESGO_MEDIO: return "MEDIO"
    return "BAJO"


# ── helpers BD ──────────────────────────────────────────────────────────────

def _insertar_prediccion(
    equipo_id: int, probabilidad_falla: float, nivel_riesgo: str,
    dias_estimados: int, anomalia_detectada: bool,
    modelo_version: str, shap_dict: dict, explicacion: dict
) -> int | None:
    try:
        return execute_insert("""
            INSERT INTO ia_predicciones
                (equipo_id, probabilidad_falla, nivel_riesgo,
                 dias_estimados, anomalia_detectada,
                 modelo_version, features_json, explicacion_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            equipo_id,
            round(probabilidad_falla, 2),
            nivel_riesgo,
            dias_estimados,
            int(anomalia_detectada),
            modelo_version,
            json.dumps(shap_dict,   default=str),
            json.dumps(explicacion, default=str),
        ))
    except Exception as e:
        logger.warning(f"Error INSERT ia_predicciones equipo {equipo_id}: {e}")
        return None


def _crear_orden(
    equipo_id: int, prediccion_id: int, nivel_riesgo: str,
    probabilidad: float, dias_estimados: int, motivo: str
) -> tuple[int, bool]:
    existente = execute_query("""
        SELECT id FROM ia_ordenes
        WHERE equipo_id = %s AND estado IN ('PENDIENTE', 'APROBADA')
        ORDER BY id DESC LIMIT 1
    """, (equipo_id,))
    if existente:
        return int(existente[0]["id"]), False

    fecha_sugerida = (date.today() + timedelta(days=max(dias_estimados, 3))).isoformat()
    orden_id = execute_insert("""
        INSERT INTO ia_ordenes
            (equipo_id, prediccion_id, fecha_sugerida,
             nivel_riesgo, probabilidad, motivo)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        equipo_id, prediccion_id, fecha_sugerida,
        nivel_riesgo, round(probabilidad * 100, 2), motivo[:1000]
    ))
    return orden_id, True


def _crear_notificacion(
    usuario_id: int, titulo: str, mensaje: str, datos: dict
) -> None:
    try:
        execute_insert("""
            INSERT INTO notificaciones
                (usuario_id, tipo, titulo, mensaje, leida, datos_json)
            VALUES (%s, 'IA_RIESGO', %s, %s, 0, %s)
        """, (
            usuario_id,
            titulo[:255],
            mensaje[:2000],
            json.dumps(datos, default=str)
        ))
    except Exception as e:
        logger.warning(f"Error creando notificación usuario {usuario_id}: {e}")

def _serializar_fechas(rows: list) -> list:
    for r in rows:
        for k, v in list(r.items()):
            if hasattr(v, "isoformat"):
                r[k] = str(v)
            if k in ("features_json", "explicacion_json") and isinstance(v, str):
                try:
                    r[k] = json.loads(v)
                except Exception:
                    pass
    return rows


# ── endpoints ───────────────────────────────────────────────────────────────

_riesgo_cache = {"ts": 0.0, "data": None}
_RIESGO_TTL = 180  # seg — evita recalcular en cada carga del dashboard


@router.get("/equipos-riesgo")
async def get_equipos_riesgo(guardar: bool = True, refrescar: bool = False):
    ahora = time.time()
    if (not refrescar and _riesgo_cache["data"] is not None
            and ahora - _riesgo_cache["ts"] < _RIESGO_TTL):
        return _riesgo_cache["data"]
    # CPU-bound (modelo + SHAP + inserts): fuera del event loop.
    data = await run_in_threadpool(_calcular_equipos_riesgo, guardar)
    _riesgo_cache["ts"] = time.time()
    _riesgo_cache["data"] = data
    return data


def _calcular_equipos_riesgo(guardar: bool = True):
    try:
        if not modelo_existe():
            res = _pipeline_completo(forzar=True)
            if res.get("estado") == "error":
                raise HTTPException(503, detail=res.get("mensaje"))

        modelo, scaler, meta = cargar_modelo()
        nombre_modelo = meta.get("modelo", "RandomForest")
        version       = meta.get("version", get_version_activa())

        df_equipos = extraer_equipos_activos()
        if df_equipos.empty:
            return {"equipos": [], "total": 0}

        features_df = construir_features_desde_resumen(df_equipos)
        X        = features_df[FEATURE_COLS].values.astype(float)
        X_scaled = scaler.transform(X)

        # Probabilidad de falla
        try:
            probs = modelo.predict_proba(X_scaled)[:, 1]
        except Exception:
            probs = np.full(len(X_scaled), 0.3)

        # Isolation Forest para anomalías
        try:
            from sklearn.ensemble import IsolationForest
            iso = IsolationForest(contamination=0.15, random_state=42, n_jobs=-1)
            iso.fit(X_scaled)
            anomalias = iso.predict(X_scaled) == -1
        except Exception:
            anomalias = np.full(len(X_scaled), False)

        resultado          = []
        ordenes_generadas  = 0
        notificaciones_env = 0
        push_events         = []

        for i, (_, row_eq) in enumerate(df_equipos.iterrows()):
            prob               = float(probs[i])
            anomalia_detectada = bool(anomalias[i])
            nivel_riesgo       = _nivel_riesgo(prob)
            equipo_id          = int(row_eq["equipo_id"])
            dias_estimados     = int(max(7, 180 * (1 - prob)))
            probabilidad_falla = round(prob * 100, 1)

            shap_dict   = calcular_shap_equipo(modelo, X_scaled[i:i+1], nombre_modelo, X_scaled)
            row_feat    = features_df.iloc[i].to_dict()
            explicacion = generar_explicacion_texto(
                shap_dict, probabilidad_falla, nivel_riesgo,
                dias_estimados, anomalia_detectada, row_feat
            )

            item = {
                "equipo_id":            equipo_id,
                "equipo_codigo":        str(row_eq.get("equipo_codigo", "")),
                "equipo_nombre":        str(row_eq.get("equipo_nombre", "")),
                "equipo_tipo":          str(row_eq.get("equipo_tipo",   "—")),
                "estado":               str(row_eq.get("estado",        "—")),
                "probabilidad_falla":   probabilidad_falla,
                "nivel_riesgo":         nivel_riesgo,
                "dias_estimados":       dias_estimados,
                "anomalia_detectada":   anomalia_detectada,
                "ultimo_mantenimiento": str(row_eq["ultimo_mantenimiento"])
                                        if row_eq.get("ultimo_mantenimiento") else None,
                "total_mantenimientos": int(row_eq.get("total_mantenimientos", 0)),
                "total_correctivos":    int(row_eq.get("total_correctivos",    0)),
                "costo_promedio":       round(float(row_eq.get("costo_promedio", 0)), 2),
                "costo_total":          round(float(row_eq.get("costo_total",    0)), 2),
                "repuestos_total":      int(row_eq.get("repuestos_total", 0)),
                "shap":                 shap_dict,
                "explicacion":          explicacion,
                "modelo_version":       version,
            }

            # Guardar predicción con nombres de columna correctos
            prediccion_id = None
            if guardar:
                prediccion_id = _insertar_prediccion(
                    equipo_id          = equipo_id,
                    probabilidad_falla = probabilidad_falla,
                    nivel_riesgo       = nivel_riesgo,
                    dias_estimados     = dias_estimados,
                    anomalia_detectada = anomalia_detectada,
                    modelo_version     = version,
                    shap_dict          = shap_dict,
                    explicacion        = explicacion,
                )
                if prediccion_id:
                    item["prediccion_id"] = prediccion_id

            # Orden automática + notificaciones
            if (guardar and prediccion_id and
                    (prob >= UMBRAL_ORDEN_AUTO or (anomalia_detectada and prob >= 0.5))):
                try:
                    motivo   = explicacion.get("conclusion", "")
                    orden_id, orden_nueva = _crear_orden(
                        equipo_id, prediccion_id, nivel_riesgo, prob, dias_estimados, motivo
                    )
                    ordenes_generadas += int(orden_nueva)
                    item["orden_id"] = orden_id

                    if orden_nueva and prob >= UMBRAL_NOTIFICACION:
                        responsable_id = get_responsable(equipo_id)
                        fecha_sug = (date.today() + timedelta(days=max(dias_estimados, 3))).isoformat()
                        if responsable_id:
                            _crear_notificacion(
                                usuario_id = responsable_id,
                                titulo     = f"Riesgo {nivel_riesgo} — {row_eq['equipo_codigo']}",
                                mensaje    = (
                                    f"IA detectó riesgo {nivel_riesgo} "
                                    f"({probabilidad_falla}%) en "
                                    f"{row_eq['equipo_codigo']} {row_eq['equipo_nombre']}. "
                                    f"Mantenimiento sugerido antes del {fecha_sug}."
                                ),
                                datos = {
                                    "equipo_id":     equipo_id,
                                    "nivel":         nivel_riesgo,
                                    "probabilidad":  probabilidad_falla,
                                    "fecha_sugerida":fecha_sug,
                                    "orden_id":      orden_id,
                                }
                            )
                            notificaciones_env += 1
                            push_events.append({
                                "usuario_id": responsable_id,
                                "titulo": f"⚠️ Riesgo {nivel_riesgo} — {row_eq['equipo_codigo']}",
                                "cuerpo": (
                                    f"IA detectó riesgo {nivel_riesgo} ({probabilidad_falla}%) "
                                    f"en tu equipo {row_eq['equipo_codigo']}."
                                ),
                                "url": "/personal/mi-equipo",
                                "tag": f"ia-riesgo-{orden_id}",
                            })
                except Exception as e:
                    logger.warning(f"Error orden/notif equipo {equipo_id}: {e}")

            resultado.append(item)

        resultado.sort(key=lambda x: x["probabilidad_falla"], reverse=True)

        return {
            "equipos":                 resultado,
            "total":                   len(resultado),
            "criticos":                sum(1 for r in resultado if r["nivel_riesgo"] == "CRÍTICO"),
            "alto_riesgo":             sum(1 for r in resultado if r["nivel_riesgo"] == "ALTO"),
            "medio_riesgo":            sum(1 for r in resultado if r["nivel_riesgo"] == "MEDIO"),
            "bajo_riesgo":             sum(1 for r in resultado if r["nivel_riesgo"] == "BAJO"),
            "anomalias":               sum(1 for r in resultado if r["anomalia_detectada"]),
            "ordenes_generadas":       ordenes_generadas,
            "notificaciones_enviadas": notificaciones_env,
            "push_events":            push_events,
            "modelo_version":          version,
            "modelo":                  nombre_modelo,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error get_equipos_riesgo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estadisticas")
async def get_estadisticas():
    try:
        df = extraer_equipos_activos()

        versiones = execute_query("""
            SELECT version, modelo_ganador, fecha,
                   equipos_usados, filas_dataset,
                   accuracy, precision_score, recall, f1, roc_auc, activa
            FROM ia_modelo_versiones
            ORDER BY fecha DESC LIMIT 5
        """)

        # ✅ Usa solo columnas de ia_predicciones que existen
        predicciones_recientes = execute_query("""
            SELECT
                p.id,
                p.fecha_prediccion,
                p.probabilidad_falla,
                p.nivel_riesgo,
                p.dias_estimados,
                p.anomalia_detectada,
                p.modelo_version,
                e.codigo AS equipo_codigo,
                e.nombre AS equipo_nombre
            FROM ia_predicciones p
            JOIN equipos e ON e.id = p.equipo_id
            ORDER BY p.fecha_prediccion DESC
            LIMIT 10
        """)

        # Resumen de predicciones por nivel
        resumen_niveles = execute_query("""
            SELECT nivel_riesgo, COUNT(*) AS cantidad
            FROM ia_predicciones
            WHERE fecha_prediccion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY nivel_riesgo
        """)

        _serializar_fechas(versiones)
        _serializar_fechas(predicciones_recientes)

        return {
            "total_equipos":             int(len(df)) if not df.empty else 0,
            "equipos_sin_mantenimiento": int((df["total_mantenimientos"] == 0).sum())
                                         if not df.empty else 0,
            "costo_total":               round(float(df["costo_total"].sum()), 2)
                                         if not df.empty else 0.0,
            "costo_promedio_global":     round(float(df["costo_promedio"].mean()), 2)
                                         if not df.empty else 0.0,
            "versiones":                 versiones,
            "predicciones_recientes":    predicciones_recientes,
            "resumen_niveles":           resumen_niveles,
            "version_activa":            get_version_activa(),
        }
    except Exception as e:
        logger.exception(f"Error estadísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historial")
async def get_historial(equipo_id: int = None, limit: int = 50):
    try:
        if equipo_id:
            rows = execute_query("""
                SELECT
                    p.id,
                    p.fecha_prediccion,
                    p.probabilidad_falla,
                    p.nivel_riesgo,
                    p.dias_estimados,
                    p.anomalia_detectada,
                    p.modelo_version,
                    p.features_json,
                    p.explicacion_json,
                    e.codigo AS equipo_codigo,
                    e.nombre AS equipo_nombre
                FROM ia_predicciones p
                JOIN equipos e ON e.id = p.equipo_id
                WHERE p.equipo_id = %s
                ORDER BY p.fecha_prediccion DESC
                LIMIT %s
            """, (equipo_id, limit))
        else:
            rows = execute_query("""
                SELECT
                    p.id,
                    p.fecha_prediccion,
                    p.probabilidad_falla,
                    p.nivel_riesgo,
                    p.dias_estimados,
                    p.anomalia_detectada,
                    p.modelo_version,
                    e.codigo AS equipo_codigo,
                    e.nombre AS equipo_nombre
                FROM ia_predicciones p
                JOIN equipos e ON e.id = p.equipo_id
                ORDER BY p.fecha_prediccion DESC
                LIMIT %s
            """, (limit,))

        return {"historial": _serializar_fechas(rows), "total": len(rows)}
    except Exception as e:
        logger.exception(f"Error historial: {e}")
        raise HTTPException(status_code=500, detail=str(e))