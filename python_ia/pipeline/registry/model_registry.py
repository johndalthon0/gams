import os
import json
import joblib
import logging
from datetime import datetime
from config import MODELS_DIR
from database import execute_query, execute_insert, execute_update

logger = logging.getLogger(__name__)

VERSION_FILE = os.path.join(MODELS_DIR, "version.txt")
MODEL_FILE   = os.path.join(MODELS_DIR, "modelo_activo.pkl")
SCALER_FILE  = os.path.join(MODELS_DIR, "scaler.pkl")
META_FILE    = os.path.join(MODELS_DIR, "meta.json")


def _nueva_version() -> str:
    if os.path.exists(VERSION_FILE):
        with open(VERSION_FILE) as f:
            v = f.read().strip()
        try:
            major, minor = v.lstrip("v").split(".")
            return f"v{major}.{int(minor) + 1}"
        except Exception:
            pass
    return "v1.0"


def modelo_existe() -> bool:
    return os.path.exists(MODEL_FILE) and os.path.exists(SCALER_FILE)


def guardar_modelo(
    modelo, scaler, nombre_modelo: str,
    metricas: dict, comparacion: dict,
    feature_cols: list, n_equipos: int, n_filas: int
) -> str:
    os.makedirs(MODELS_DIR, exist_ok=True)
    version = _nueva_version()

    joblib.dump(modelo, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)

    meta = {
        "version":      version,
        "modelo":       nombre_modelo,
        "fecha":        datetime.now().isoformat(),
        "n_equipos":    n_equipos,
        "n_filas":      n_filas,
        "feature_cols": feature_cols,
        "metricas":     metricas,
    }
    with open(META_FILE, "w") as f:
        json.dump(meta, f, indent=2, default=str)
    with open(VERSION_FILE, "w") as f:
        f.write(version)

    # Guardar en BD — usando columnas que SÍ existen
    try:
        execute_update("UPDATE ia_modelo_versiones SET activa = 0")
        execute_insert("""
            INSERT INTO ia_modelo_versiones
                (version, modelo_ganador, equipos_usados, filas_dataset,
                 accuracy, precision_score, recall, f1, roc_auc,
                 metricas_json, features_json, comparacion_json, activa, notas)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,%s)
        """, (
            version,
            nombre_modelo,
            n_equipos,
            n_filas,
            float(metricas.get("accuracy",  0)),
            float(metricas.get("precision", 0)),
            float(metricas.get("recall",    0)),
            float(metricas.get("f1",        0)),
            float(metricas.get("roc_auc",   0)),
            json.dumps(metricas,    default=str),
            json.dumps(feature_cols,default=str),
            json.dumps(comparacion, default=str),
            f"Entrenamiento automático — {nombre_modelo}"
        ))
        logger.info(f"Versión guardada en BD: {version}")
    except Exception as e:
        logger.error(f"Error guardando versión en BD: {e}")

    return version


def cargar_modelo():
    if not modelo_existe():
        raise FileNotFoundError("No hay modelo entrenado — ejecuta POST /ia/entrenar")
    modelo = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    meta   = {}
    if os.path.exists(META_FILE):
        with open(META_FILE) as f:
            meta = json.load(f)
    return modelo, scaler, meta


def get_version_activa() -> str:
    if os.path.exists(VERSION_FILE):
        with open(VERSION_FILE) as f:
            return f.read().strip()
    return "sin versión"


def get_historial_versiones(limit: int = 10) -> list:
    try:
        return execute_query("""
            SELECT version, modelo_ganador, fecha, equipos_usados,
                   filas_dataset, accuracy, precision_score,
                   recall, f1, roc_auc, activa
            FROM ia_modelo_versiones
            ORDER BY fecha DESC LIMIT %s
        """, (limit,))
    except Exception as e:
        logger.error(f"Error leyendo versiones: {e}")
        return []


def hay_suficientes_datos_nuevos() -> bool:
    try:
        rows = execute_query("""
            SELECT filas_dataset FROM ia_modelo_versiones
            WHERE activa = 1 LIMIT 1
        """)
        if not rows or not rows[0].get("filas_dataset"):
            return True
        ultima = int(rows[0]["filas_dataset"])
        actual = execute_query(
            "SELECT COUNT(*) AS total FROM mantenimientos WHERE estado='FINALIZADO'"
        )
        total = int(actual[0]["total"]) if actual else 0
        return total >= ultima * 1.15
    except Exception:
        return True