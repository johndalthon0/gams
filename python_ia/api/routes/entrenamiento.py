import logging
import numpy as np
from fastapi import APIRouter, HTTPException
from sklearn.model_selection import train_test_split

from pipeline.data.extractor    import extraer_dataset_historial
from pipeline.data.cleaner      import limpiar_dataset, validar_dataset
from pipeline.features.engineer import construir_features_para_entrenamiento, FEATURE_COLS
from pipeline.training.trainer  import preparar_datos, entrenar_todos
from pipeline.evaluation.evaluator  import comparar_modelos, seleccionar_mejor_modelo
from pipeline.registry.model_registry import (
    guardar_modelo, hay_suficientes_datos_nuevos,
    get_historial_versiones, get_version_activa
)
from config import TEST_SIZE, RANDOM_STATE, MIN_FILAS_TRAIN

logger  = logging.getLogger(__name__)
router  = APIRouter()
_estado = {"entrenando": False}


def _pipeline_completo(forzar: bool = False) -> dict:
    if _estado["entrenando"]:
        return {"estado": "en_progreso", "mensaje": "Ya hay un entrenamiento en curso"}

    if not forzar and not hay_suficientes_datos_nuevos():
        return {
            "estado":  "sin_cambios",
            "mensaje": "No hay suficientes datos nuevos",
            "version": get_version_activa()
        }

    _estado["entrenando"] = True
    try:
        logger.info("PIPELINE [1/6] Extrayendo datos...")
        df_raw = extraer_dataset_historial()

        logger.info("PIPELINE [2/6] Limpiando datos...")
        df = limpiar_dataset(df_raw)
        valido, msg = validar_dataset(df, MIN_FILAS_TRAIN)
        if not valido:
            logger.warning(f"Dataset inválido: {msg}")
            # Con pocos datos usamos modelo sintético
            return _entrenar_sintetico()

        logger.info("PIPELINE [3/6] Construyendo features...")
        df_feat = construir_features_para_entrenamiento(df)
        X = df_feat[FEATURE_COLS].values.astype(float)
        y = df_feat["etiqueta"].values

        logger.info("PIPELINE [4/6] Preparando datos (escala + SMOTE)...")
        X_scaled, y_bal, scaler = preparar_datos(X, y)

        # Verificar que haya suficientes muestras para split estratificado
        unique, counts = np.unique(y_bal, return_counts=True)
        min_count = int(counts.min())
        n_splits  = min(5, min_count)

        if min_count < 2:
            logger.warning("Clase minoritaria con < 2 muestras — entrenando sin split")
            X_train, X_test, y_train, y_test = X_scaled, X_scaled, y_bal, y_bal
        else:
            stratify = y_bal if min_count >= 2 else None
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y_bal, test_size=TEST_SIZE,
                random_state=RANDOM_STATE, stratify=stratify
            )

        logger.info("PIPELINE [5/6] Entrenando modelos candidatos...")
        modelos = entrenar_todos(X_train, y_train)
        if not modelos:
            return {"estado": "error", "mensaje": "Ningún modelo entrenado"}

        logger.info("PIPELINE [6/6] Evaluando y seleccionando...")
        comparacion = comparar_modelos(modelos, X_test, y_test, X_scaled, y_bal)
        ganador_nombre = seleccionar_mejor_modelo(comparacion)
        modelo_ganador = modelos[ganador_nombre]
        metricas       = comparacion[ganador_nombre]

        version = guardar_modelo(
            modelo=modelo_ganador, scaler=scaler,
            nombre_modelo=ganador_nombre, metricas=metricas,
            comparacion=comparacion, feature_cols=FEATURE_COLS,
            n_equipos=int(df["equipo_id"].nunique()), n_filas=len(df)
        )

        logger.info(f"PIPELINE completado → {version} ({ganador_nombre})")
        return {
            "estado":      "entrenado",
            "version":     version,
            "modelo":      ganador_nombre,
            "metricas":    metricas,
            "comparacion": comparacion,
            "n_equipos":   int(df["equipo_id"].nunique()),
            "n_filas":     len(df),
        }

    except Exception as e:
        logger.exception(f"Error en pipeline: {e}")
        return {"estado": "error", "mensaje": str(e)}
    finally:
        _estado["entrenando"] = False


def _entrenar_sintetico() -> dict:
    """
    Entrena con datos sintéticos cuando el historial es insuficiente.
    Permite que el sistema funcione desde el primer día.
    """
    import os
    import joblib
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    from config import MODELS_DIR, RANDOM_STATE

    logger.info("Entrenando con datos sintéticos (historial insuficiente)...")
    n = 100
    rng = np.random.RandomState(RANDOM_STATE)
    X = rng.rand(n, len(FEATURE_COLS)).astype(float)
    y = (X[:, 0] > 0.5).astype(int)

    scaler  = StandardScaler()
    X_sc    = scaler.fit_transform(X)
    modelo  = RandomForestClassifier(n_estimators=50, random_state=RANDOM_STATE)
    modelo.fit(X_sc, y)

    os.makedirs(MODELS_DIR, exist_ok=True)
    version = "v0.0-sintetico"
    import json
    joblib.dump(modelo, os.path.join(MODELS_DIR, "modelo_activo.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
    with open(os.path.join(MODELS_DIR, "version.txt"), "w") as f:
        f.write(version)
    with open(os.path.join(MODELS_DIR, "meta.json"), "w") as f:
        json.dump({"version": version, "modelo": "RandomForest-sintetico",
                   "feature_cols": FEATURE_COLS}, f)

    return {
        "estado":  "sintetico",
        "version": version,
        "mensaje": "Modelo sintético — mejorará automáticamente con más historial de mantenimientos"
    }


@router.post("/entrenar")
def entrenar(forzar: bool = False):
    # Handler sync => FastAPI lo corre en su threadpool, así el entrenamiento
    # (CPU-bound) no bloquea el event loop ni deja sin responder al resto.
    try:
        return _pipeline_completo(forzar)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/versiones")
def get_versiones(limit: int = 10):
    try:
        rows = get_historial_versiones(limit)
        for r in rows:
            for k, val in list(r.items()):
                if hasattr(val, "isoformat"):
                    r[k] = str(val)
        return {"versiones": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estado")
def estado_entrenamiento():
    return {
        "entrenando": _estado["entrenando"],
        "version_activa": get_version_activa()
    }