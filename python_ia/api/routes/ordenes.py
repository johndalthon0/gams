import json
import logging
from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from database import execute_query, execute_update, execute_insert
from api.schemas.schemas import PropuestaAccion

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class AccionOrdenTrabajo(BaseModel):
    orden_id:      int
    accion:        str          # INICIAR | PAUSAR | FINALIZAR
    observaciones: Optional[str] = ""
    costo_final:   Optional[float] = 0.0

class RepuestoOrden(BaseModel):
    orden_id:    int
    repuesto_id: int
    cantidad:    int
    precio_unit: float

class AprobarOrden(BaseModel):
    orden_id:   int
    usuario_id: int             # admin que aprueba


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serializar(rows: list) -> list:
    for r in rows:
        for k, v in list(r.items()):
            if hasattr(v, "isoformat"):
                r[k] = str(v)
    return rows


# Reemplaza la función _notificar existente con esta versión extendida:
def _notificar(usuario_id, tipo, titulo, mensaje, datos,
               referencia_id=None, referencia_tipo=None,
               requiere_respuesta=False):
    try:
        execute_insert("""
            INSERT INTO notificaciones
                (usuario_id, tipo, titulo, mensaje, leida, datos_json,
                 referencia_id, referencia_tipo,
                 respondida, respuesta)
            VALUES (%s,%s,%s,%s,0,%s,%s,%s,%s,'PENDIENTE')
        """, (
            usuario_id, tipo, titulo[:255], mensaje[:2000],
            json.dumps(datos, default=str),
            referencia_id, referencia_tipo,
            0 if requiere_respuesta else 1
        ))
    except Exception as e:
        logger.warning(f"Error notif uid={usuario_id}: {e}")


def _get_admins() -> list[int]:
    rows = execute_query("""
        SELECT DISTINCT u.id FROM usuarios u
        JOIN usuario_roles ur ON ur.usuario_id = u.id
        JOIN roles r ON r.id = ur.rol_id
        WHERE r.nombre = 'ADMIN' AND u.estado = 1
    """)
    return [r["id"] for r in rows]


def _get_responsable_equipo(equipo_id: int) -> int | None:
    rows = execute_query("""
        SELECT usuario_id FROM asignaciones
        WHERE equipo_id = %s AND estado = 1
        LIMIT 1
    """, (equipo_id,))
    return rows[0]["usuario_id"] if rows else None


def _seleccionar_tecnico(equipo_id: int) -> dict | None:
    """
    Busca el técnico con menor carga activa.
    Prioriza técnicos especializados en el tipo del equipo.
    """
    # Técnicos especializados para este tipo de equipo
    especializados = execute_query("""
        SELECT u.id, u.nombre, u.apellido,
               COUNT(ot.id) AS carga_activa,
               te.nivel
        FROM usuarios u
        JOIN usuario_roles ur ON ur.usuario_id = u.id
        JOIN roles r          ON r.id = ur.rol_id
        JOIN tecnico_especialidades te ON te.usuario_id = u.id
        JOIN equipos e ON e.id = %s
        LEFT JOIN ia_ordenes_trabajo ot
               ON ot.tecnico_id = u.id
              AND ot.estado IN ('PROGRAMADO','EN_PROCESO')
        WHERE r.nombre = 'EMPLEADO'
          AND u.estado = 1
          AND te.tipo_equipo_id = e.tipo_id
        GROUP BY u.id, u.nombre, u.apellido, te.nivel
        ORDER BY carga_activa ASC, te.nivel DESC
        LIMIT 1
    """, (equipo_id,))

    if especializados:
        return especializados[0]

    # Cualquier técnico con menor carga
    todos = execute_query("""
        SELECT u.id, u.nombre, u.apellido,
               COUNT(ot.id) AS carga_activa
        FROM usuarios u
        JOIN usuario_roles ur ON ur.usuario_id = u.id
        JOIN roles r          ON r.id = ur.rol_id
        LEFT JOIN ia_ordenes_trabajo ot
               ON ot.tecnico_id = u.id
              AND ot.estado IN ('PROGRAMADO','EN_PROCESO')
        WHERE r.nombre = 'EMPLEADO'
          AND u.estado = 1
        GROUP BY u.id, u.nombre, u.apellido
        ORDER BY carga_activa ASC
        LIMIT 1
    """)
    return todos[0] if todos else None


def _ya_tiene_orden_activa(equipo_id: int) -> bool:
    rows = execute_query("""
        SELECT COUNT(*) AS total FROM ia_ordenes_trabajo
        WHERE equipo_id = %s
          AND estado IN ('PROGRAMADO','EN_PROCESO')
    """, (equipo_id,))
    return rows[0]["total"] > 0 if rows else False


# ── Endpoints órdenes IA ──────────────────────────────────────────────────────

@router.get("/")
async def get_ordenes(estado: str = None):
    try:
        if estado:
            rows = execute_query("""
                SELECT o.id, o.equipo_id, o.prediccion_id,
                       o.fecha_generada, o.fecha_sugerida,
                       o.nivel_riesgo, o.probabilidad,
                       o.motivo, o.estado,
                       o.aprobada_por, o.fecha_accion,
                       e.codigo AS equipo_codigo,
                       e.nombre AS equipo_nombre,
                       t.nombre AS equipo_tipo
                FROM ia_ordenes o
                JOIN equipos e ON e.id = o.equipo_id
                LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
                WHERE o.estado = %s
                ORDER BY o.fecha_generada DESC
            """, (estado,))
        else:
            rows = execute_query("""
                SELECT o.id, o.equipo_id, o.prediccion_id,
                       o.fecha_generada, o.fecha_sugerida,
                       o.nivel_riesgo, o.probabilidad,
                       o.motivo, o.estado,
                       o.aprobada_por, o.fecha_accion,
                       e.codigo AS equipo_codigo,
                       e.nombre AS equipo_nombre,
                       t.nombre AS equipo_tipo
                FROM ia_ordenes o
                JOIN equipos e ON e.id = o.equipo_id
                LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
                ORDER BY o.fecha_generada DESC
                LIMIT 100
            """)
        pendientes = sum(1 for r in rows if r.get("estado") == "PENDIENTE")
        return {"ordenes": _serializar(rows), "total": len(rows), "pendientes": pendientes}
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))


@router.put("/accion")
async def accionar_orden(data: PropuestaAccion):
    """
    Aprueba o rechaza una orden IA.
    Si APROBADA: crea mantenimiento PROGRAMADO + orden de trabajo + notificaciones.
    """
    if data.accion not in ("APROBADA", "RECHAZADA", "EJECUTADA"):
        raise HTTPException(400, detail="Acción inválida")

    try:
        # Marcar la orden IA
        execute_update("""
            UPDATE ia_ordenes
            SET estado = %s, aprobada_por = %s, fecha_accion = NOW()
            WHERE id = %s
        """, (data.accion, data.usuario_id, data.orden_id))

        if data.accion != "APROBADA":
            return {"message": f"Orden {data.accion.lower()}"}

        # ── FLUJO DE APROBACIÓN ──────────────────────────────────────────────
        orden = execute_query(
            "SELECT * FROM ia_ordenes WHERE id = %s", (data.orden_id,)
        )
        if not orden:
            raise HTTPException(404, detail="Orden no encontrada")
        orden = orden[0]

        equipo_id = int(orden["equipo_id"])

                # Evitar duplicados
        if _ya_tiene_orden_activa(equipo_id):
            return {
                "message": "Ya existe una orden activa para este equipo",
                "duplicado": True
            }

        fecha_programada = orden.get("fecha_sugerida")

        # Si viene como datetime convertir a date
        if isinstance(fecha_programada, datetime):
            fecha_programada = fecha_programada.date()

        # Si no existe programar para dentro de 7 días
        if not fecha_programada:
            fecha_programada = date.today() + timedelta(days=7)

        # Seleccionar técnico
        tecnico = _seleccionar_tecnico(equipo_id)
        tecnico_id = tecnico["id"] if tecnico else None
        tecnico_nombre = (
            f"{tecnico['nombre']} {tecnico.get('apellido','')}"
            if tecnico else "Sin asignar"
        )

        # Datos del equipo
        equipo = execute_query("""
            SELECT e.codigo, e.nombre, t.nombre AS tipo
            FROM equipos e
            LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
            WHERE e.id = %s
        """, (equipo_id,))[0]

        # Crear mantenimiento PROGRAMADO
        mant_id = execute_insert("""
            INSERT INTO mantenimientos
                (equipo_id, tipo, descripcion, descripcion_problema,
                 tecnico, tecnico_usuario_id,
                 fecha_programada, estado)
            VALUES (%s, 'PREVENTIVO', %s, %s, %s, %s, %s, 'PROGRAMADO')
        """, (
            equipo_id,
            f"Mantenimiento preventivo programado por IA",
            orden.get("motivo", "Riesgo detectado por IA")[:500],
            tecnico_nombre,
            tecnico_id,
            fecha_programada,
        ))

        # Crear orden de trabajo
        ot_id = execute_insert("""
            INSERT INTO ia_ordenes_trabajo
                (orden_ia_id, mantenimiento_id, equipo_id,
                 tecnico_id, aprobada_por, fecha_programada, estado)
            VALUES (%s, %s, %s, %s, %s, %s, 'PROGRAMADO')
        """, (
            data.orden_id, mant_id, equipo_id,
            tecnico_id, data.usuario_id, fecha_programada,
        ))

         # Actualizar estado del equipo
        execute_update(
            "UPDATE equipos SET estado='MANTENIMIENTO' WHERE id=%s",
            (equipo_id,)
        )

        fecha_str = str(fecha_programada)
        cod = equipo["codigo"]
        nom = equipo["nombre"]

        # Notificar admins
        for uid in _get_admins():
            _notificar(
                uid,
                "ORDEN_TRABAJO",
                f"Orden #{ot_id} generada — {cod}",
                f"Mantenimiento preventivo programado para {cod} — {nom}. "
                f"Técnico: {tecnico_nombre}. Fecha: {fecha_str}.",
                {
                    "orden_trabajo_id": ot_id,
                    "mantenimiento_id": mant_id,
                    "equipo_id": equipo_id
                },
                referencia_id=ot_id,
                referencia_tipo="ORDEN_TRABAJO"
            )

        # Notificar técnico
        if tecnico_id:
            _notificar(
                tecnico_id,
                "ASIGNACION",
                f"Nuevo mantenimiento asignado — {cod}",
                f"Se le asignó el mantenimiento de {cod} — {nom} "
                f"programado para el {fecha_str}. Acceda a su bandeja.",
                {
                    "orden_trabajo_id": ot_id,
                    "equipo_id": equipo_id,
                    "fecha_programada": fecha_str
                },
                referencia_id=ot_id,
                referencia_tipo="ORDEN_TRABAJO"
            )

        # Notificar responsable del equipo (requiere respuesta)
        responsable = _get_responsable_equipo(equipo_id)
        if responsable:
            _notificar(
                responsable,
                "SOLICITUD_MANT",
                f"⚠️ Su equipo {cod} requiere mantenimiento el {fecha_str}",
                f"La IA detectó que su equipo {cod} — {nom} necesita "
                f"mantenimiento preventivo programado para el {fecha_str}. "
                f"Por favor confirme si el equipo estará disponible ese día "
                f"guardando su información con anticipación. "
                f"Puede APROBAR (confirmar disponibilidad) o RECHAZAR "
                f"(solicitar reprogramación).",
                {
                    "orden_trabajo_id": ot_id,
                    "equipo_id": equipo_id,
                    "fecha_programada": fecha_str,
                    "cod": cod,
                    "nom": nom
                },
                referencia_id=ot_id,
                referencia_tipo="ORDEN_TRABAJO",
                requiere_respuesta=True
            )

        return {
            "message": "Orden aprobada y mantenimiento programado",
            "mantenimiento_id": mant_id,
            "orden_trabajo_id": ot_id,
            "tecnico": tecnico_nombre,
            "fecha_programada": fecha_str,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))

# ── Bandeja del técnico ───────────────────────────────────────────────────────

@router.get("/mis-ordenes/{usuario_id}")
async def mis_ordenes(usuario_id: int):
    try:
        rows = execute_query("""
            SELECT
                ot.id, ot.estado, ot.fecha_creacion,
                ot.fecha_programada, ot.fecha_inicio, ot.fecha_fin,
                ot.observaciones, ot.costo_final,
                e.id   AS equipo_id,
                e.codigo AS equipo_codigo,
                e.nombre AS equipo_nombre,
                t.nombre AS equipo_tipo,
                s.nombre AS sucursal,
                u.nombre AS responsable_nombre,
                u.apellido AS responsable_apellido,
                m.id       AS mantenimiento_id,
                m.descripcion_problema,
                o.nivel_riesgo, o.probabilidad, o.motivo AS motivo_ia
            FROM ia_ordenes_trabajo ot
            JOIN equipos e        ON e.id  = ot.equipo_id
            LEFT JOIN tipos_equipo t ON t.id  = e.tipo_id
            LEFT JOIN sucursales  s  ON s.id  = e.sucursal_id
            LEFT JOIN asignaciones a ON a.equipo_id = e.id AND a.estado = 1
            LEFT JOIN usuarios    u  ON u.id  = a.usuario_id
            LEFT JOIN mantenimientos m ON m.id = ot.mantenimiento_id
            LEFT JOIN ia_ordenes  o  ON o.id  = ot.orden_ia_id
            WHERE ot.tecnico_id = %s
            ORDER BY ot.fecha_programada ASC
        """, (usuario_id,))

        # Repuestos de cada orden
        for r in rows:
            r["repuestos"] = execute_query("""
                SELECT ir.id, ir.cantidad, ir.precio_unit,
                       rp.nombre, rp.tipo
                FROM ia_orden_repuestos ir
                JOIN repuestos rp ON rp.id = ir.repuesto_id
                WHERE ir.orden_id = %s
            """, (r["id"],))

        activas     = sum(1 for r in rows if r["estado"] in ("PROGRAMADO","EN_PROCESO"))
        finalizadas = sum(1 for r in rows if r["estado"] == "FINALIZADO")
        return {
            "ordenes":    _serializar(rows),
            "total":      len(rows),
            "activas":    activas,
            "finalizadas":finalizadas,
        }
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))


@router.put("/trabajo/accion")
async def accion_orden_trabajo(data: AccionOrdenTrabajo):
    """
    El técnico inicia, pausa o finaliza una orden de trabajo.
    Al finalizar: actualiza mantenimiento, registra feedback y notifica.
    """
    validas = ("INICIAR", "PAUSAR", "FINALIZAR")
    if data.accion not in validas:
        raise HTTPException(400, detail=f"Acción debe ser una de: {validas}")

    try:
        orden = execute_query(
            "SELECT * FROM ia_ordenes_trabajo WHERE id = %s", (data.orden_id,)
        )
        if not orden:
            raise HTTPException(404, detail="Orden no encontrada")
        orden = orden[0]

        if data.accion == "INICIAR":
            execute_update("""
                UPDATE ia_ordenes_trabajo
                SET estado='EN_PROCESO', fecha_inicio=NOW()
                WHERE id=%s
            """, (data.orden_id,))
            if orden.get("mantenimiento_id"):
                execute_update("""
                    UPDATE mantenimientos
                    SET estado='EN_PROCESO', fecha_inicio=NOW()
                    WHERE id=%s
                """, (orden["mantenimiento_id"],))

        elif data.accion == "PAUSAR":
            execute_update("""
                UPDATE ia_ordenes_trabajo
                SET estado='PAUSADO',
                    observaciones=COALESCE(CONCAT(observaciones,'\n',%s),%s)
                WHERE id=%s
            """, (data.observaciones or "", data.observaciones or "", data.orden_id))

        elif data.accion == "FINALIZAR":
            execute_update("""
                UPDATE ia_ordenes_trabajo
                SET estado='FINALIZADO',
                    fecha_fin=NOW(),
                    observaciones=%s,
                    costo_final=%s
                WHERE id=%s
            """, (data.observaciones or "", data.costo_final or 0, data.orden_id))

            if orden.get("mantenimiento_id"):
                execute_update("""
                    UPDATE mantenimientos
                    SET estado='FINALIZADO',
                        fecha_fin=NOW(),
                        costo=%s,
                        descripcion_solucion=%s
                    WHERE id=%s
                """, (
                    data.costo_final or 0,
                    data.observaciones or "",
                    orden["mantenimiento_id"]
                ))

            # Restaurar estado del equipo
            equipo_id = int(orden["equipo_id"])
            tiene_asig = execute_query(
                "SELECT id FROM asignaciones WHERE equipo_id=%s AND estado=1", (equipo_id,)
            )
            estado_eq = "ASIGNADO" if tiene_asig else "DISPONIBLE"
            execute_update("UPDATE equipos SET estado=%s WHERE id=%s", (estado_eq, equipo_id))

            # Registrar feedback para el modelo
            _registrar_feedback(orden, data.costo_final or 0, data.observaciones or "")

            # Notificar finalización
            equipo = execute_query(
                "SELECT codigo, nombre FROM equipos WHERE id=%s", (equipo_id,)
            )[0]
            for uid in _get_admins():
                _notificar(uid, "MANT_FINALIZADO",
                    f"Mantenimiento finalizado — {equipo['codigo']}",
                    f"El mantenimiento del equipo {equipo['codigo']} ha sido finalizado. "
                    f"Costo final: Bs {data.costo_final or 0}.",
                    {"orden_trabajo_id": data.orden_id, "equipo_id": equipo_id})

            responsable = _get_responsable_equipo(equipo_id)
            if responsable:
                _notificar(responsable, "MANT_FINALIZADO",
                    f"Mantenimiento de {equipo['codigo']} completado",
                    f"El mantenimiento de su equipo {equipo['codigo']} — {equipo['nombre']} "
                    f"ha sido completado. El equipo ya está disponible.",
                    {"equipo_id": equipo_id})

        return {"message": f"Orden {data.accion.lower()}da correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))


@router.post("/trabajo/repuesto")
async def agregar_repuesto(data: RepuestoOrden):
    try:
        # Verificar stock
        stock = execute_query(
            "SELECT stock FROM repuestos WHERE id=%s", (data.repuesto_id,)
        )
        if not stock or stock[0]["stock"] < data.cantidad:
            raise HTTPException(400, detail="Stock insuficiente")

        execute_insert("""
            INSERT INTO ia_orden_repuestos
                (orden_id, repuesto_id, cantidad, precio_unit)
            VALUES (%s, %s, %s, %s)
        """, (data.orden_id, data.repuesto_id, data.cantidad, data.precio_unit))

        execute_update(
            "UPDATE repuestos SET stock = stock - %s WHERE id=%s",
            (data.cantidad, data.repuesto_id)
        )

        # Actualizar costo de la orden con el nuevo repuesto
        execute_update("""
            UPDATE ia_ordenes_trabajo
            SET costo_final = (
                SELECT COALESCE(SUM(cantidad * precio_unit), 0)
                FROM ia_orden_repuestos WHERE orden_id = %s
            )
            WHERE id = %s
        """, (data.orden_id, data.orden_id))

        return {"message": "Repuesto agregado"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))


# ── Feedback para el modelo ───────────────────────────────────────────────────

def _registrar_feedback(orden: dict, costo_real: float, observaciones: str):
    try:
        equipo_id = int(orden["equipo_id"])

        # Obtener predicción más reciente del equipo
        pred = execute_query("""
            SELECT id, probabilidad_falla, nivel_riesgo
            FROM ia_predicciones
            WHERE equipo_id = %s
            ORDER BY fecha_prediccion DESC LIMIT 1
        """, (equipo_id,))

        prediccion_id = pred[0]["id"]          if pred else None
        prob_pred     = float(pred[0]["probabilidad_falla"]) if pred else 0.0
        nivel_pred    = pred[0]["nivel_riesgo"] if pred else None

        # ¿La predicción fue correcta?
        # Se considera correcta si predijo riesgo ALTO/CRÍTICO y fue correctivo
        mant = execute_query(
            "SELECT tipo FROM mantenimientos WHERE id=%s",
            (orden.get("mantenimiento_id"),)
        ) if orden.get("mantenimiento_id") else []
        tipo_mant  = mant[0]["tipo"] if mant else "PREVENTIVO"
        fallo_real = tipo_mant == "CORRECTIVO"
        pred_alta  = nivel_pred in ("ALTO", "CRÍTICO") if nivel_pred else False
        pred_correcta = (pred_alta == fallo_real)

        # Duración en días
        duracion = 0
        if orden.get("fecha_inicio") and orden.get("fecha_fin"):
            try:
                fi = orden["fecha_inicio"]
                ff = orden["fecha_fin"]
                if hasattr(fi, "date"):
                    duracion = (ff - fi).days
            except Exception:
                duracion = 0

        # Contar repuestos
        rep_qty = execute_query(
            "SELECT COALESCE(SUM(cantidad),0) AS total FROM ia_orden_repuestos WHERE orden_id=%s",
            (int(orden["id"]),)
        )
        total_rep = int(rep_qty[0]["total"]) if rep_qty else 0

        execute_insert("""
            INSERT INTO ia_feedback
                (orden_trabajo_id, equipo_id, prediccion_id,
                 prediccion_correcta, fallo_real,
                 probabilidad_pred, costo_real,
                 duracion_dias, repuestos_qty, observaciones)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            int(orden["id"]), equipo_id, prediccion_id,
            int(pred_correcta), int(fallo_real),
            prob_pred, costo_real,
            duracion, total_rep, observaciones[:1000]
        ))

        logger.info(f"Feedback registrado — equipo {equipo_id}, correcta={pred_correcta}")
    except Exception as e:
        logger.warning(f"Error registrando feedback: {e}")


# ── Panel del administrador ───────────────────────────────────────────────────

@router.get("/panel-admin")
async def panel_admin():
    try:
        # Órdenes de trabajo por estado
        estados_ot = execute_query("""
            SELECT estado, COUNT(*) AS total
            FROM ia_ordenes_trabajo
            GROUP BY estado
        """)
        por_estado = {r["estado"]: int(r["total"]) for r in estados_ot}

        # Técnicos y su carga
        tecnicos = execute_query("""
            SELECT u.id, u.nombre, u.apellido,
                   COUNT(ot.id) AS ordenes_activas
            FROM usuarios u
            JOIN usuario_roles ur ON ur.usuario_id = u.id
            JOIN roles r ON r.id = ur.rol_id
            LEFT JOIN ia_ordenes_trabajo ot
                   ON ot.tecnico_id = u.id
                  AND ot.estado IN ('PROGRAMADO','EN_PROCESO')
            WHERE r.nombre = 'EMPLEADO' AND u.estado = 1
            GROUP BY u.id, u.nombre, u.apellido
            ORDER BY ordenes_activas ASC
        """)

        # Tiempo promedio de reparación
        tiempo_prom = execute_query("""
            SELECT ROUND(AVG(duracion_dias), 1) AS promedio_dias
            FROM ia_feedback
            WHERE duracion_dias > 0
        """)
        promedio_dias = float(tiempo_prom[0]["promedio_dias"]) if tiempo_prom and tiempo_prom[0]["promedio_dias"] else 0

        # Precisión histórica de la IA
        precision = execute_query("""
            SELECT
                COUNT(*)                                        AS total,
                SUM(prediccion_correcta)                        AS correctas,
                ROUND(AVG(prediccion_correcta)*100, 1)          AS precision_pct
            FROM ia_feedback
        """)
        prec = precision[0] if precision else {}

        # Recomendaciones aceptadas y rechazadas
        recomendaciones = execute_query("""
            SELECT estado, COUNT(*) AS total
            FROM ia_ordenes
            WHERE estado IN ('APROBADA','RECHAZADA')
            GROUP BY estado
        """)
        rec_map = {r["estado"]: int(r["total"]) for r in recomendaciones}

        # Precisión por versión del modelo
        por_version = execute_query("""
            SELECT v.version, v.modelo_ganador,
                   v.accuracy, v.f1, v.roc_auc,
                   COUNT(fb.id)                          AS feedbacks,
                   ROUND(AVG(fb.prediccion_correcta)*100,1) AS precision_real
            FROM ia_modelo_versiones v
            LEFT JOIN ia_predicciones p ON p.modelo_version = v.version
            LEFT JOIN ia_feedback fb    ON fb.prediccion_id = p.id
            GROUP BY v.version, v.modelo_ganador, v.accuracy, v.f1, v.roc_auc
            ORDER BY v.fecha DESC LIMIT 5
        """)

        return {
            "ordenes_trabajo": {
                "programadas": por_estado.get("PROGRAMADO", 0),
                "en_proceso":  por_estado.get("EN_PROCESO", 0),
                "pausadas":    por_estado.get("PAUSADO",    0),
                "finalizadas": por_estado.get("FINALIZADO", 0),
            },
            "tecnicos": _serializar(tecnicos),
            "tecnicos_disponibles": sum(1 for t in tecnicos if t["ordenes_activas"] == 0),
            "tecnicos_ocupados":    sum(1 for t in tecnicos if t["ordenes_activas"] > 0),
            "tiempo_promedio_reparacion": promedio_dias,
            "precision_ia": {
                "total":         int(prec.get("total",    0) or 0),
                "correctas":     int(prec.get("correctas",0) or 0),
                "precision_pct": float(prec.get("precision_pct", 0) or 0),
            },
            "recomendaciones": {
                "aceptadas":  rec_map.get("APROBADA",  0),
                "rechazadas": rec_map.get("RECHAZADA", 0),
            },
            "precision_por_version": _serializar(por_version),
        }

    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))