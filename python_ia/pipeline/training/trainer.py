import numpy as np
import logging
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
)
from sklearn.preprocessing import StandardScaler
from config import RANDOM_STATE, MIN_FILAS_TRAIN

logger = logging.getLogger(__name__)

# ── Opcionales ────────────────────────────────────────────────
try:
    from xgboost import XGBClassifier
    XGB_OK = True
except ImportError:
    XGB_OK = False
    logger.warning("XGBoost no disponible — se omite")

try:
    from lightgbm import LGBMClassifier
    LGB_OK = True
except ImportError:
    LGB_OK = False
    logger.warning("LightGBM no disponible — se omite")

try:
    from imblearn.over_sampling import SMOTE
    SMOTE_OK = True
except ImportError:
    SMOTE_OK = False
    logger.warning("imbalanced-learn no disponible — SMOTE omitido")


def get_modelos_candidatos() -> dict:
    modelos = {
        "RandomForest": RandomForestClassifier(
            n_estimators=100, max_depth=8,
            class_weight="balanced",
            random_state=RANDOM_STATE, n_jobs=-1
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=100, max_depth=5,
            learning_rate=0.05, random_state=RANDOM_STATE
        ),
        "ExtraTrees": ExtraTreesClassifier(
            n_estimators=100, max_depth=8,
            class_weight="balanced",
            random_state=RANDOM_STATE, n_jobs=-1
        ),
    }
    if XGB_OK:
        modelos["XGBoost"] = XGBClassifier(
            n_estimators=100, max_depth=6,
            learning_rate=0.05,
            eval_metric="logloss",
            random_state=RANDOM_STATE, n_jobs=-1
        )
    if LGB_OK:
        modelos["LightGBM"] = LGBMClassifier(
            n_estimators=100, max_depth=6,
            learning_rate=0.05,
            class_weight="balanced",
            random_state=RANDOM_STATE, n_jobs=-1, verbose=-1
        )
    return modelos


def preparar_datos(X: np.ndarray, y: np.ndarray):
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    if SMOTE_OK:
        min_clase = int(np.bincount(y).min())
        if min_clase >= 2 and len(y) >= MIN_FILAS_TRAIN:
            try:
                k  = min(min_clase - 1, 5)
                sm = SMOTE(random_state=RANDOM_STATE, k_neighbors=k)
                X_scaled, y = sm.fit_resample(X_scaled, y)
                logger.info(f"SMOTE aplicado → {len(y)} filas balanceadas")
            except Exception as e:
                logger.warning(f"SMOTE omitido: {e}")

    return X_scaled, y, scaler


def entrenar_todos(X_train: np.ndarray, y_train: np.ndarray) -> dict:
    modelos   = get_modelos_candidatos()
    entrenados = {}
    for nombre, modelo in modelos.items():
        try:
            modelo.fit(X_train, y_train)
            entrenados[nombre] = modelo
            logger.info(f"✅ Entrenado: {nombre}")
        except Exception as e:
            logger.error(f"❌ Error {nombre}: {e}")
    return entrenados