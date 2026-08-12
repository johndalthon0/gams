import numpy as np
import pandas as pd
import logging
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
from config import CV_FOLDS, RANDOM_STATE

logger = logging.getLogger(__name__)


def evaluar_modelo(
    modelo, X_test: np.ndarray, y_test: np.ndarray,
    X_full: np.ndarray = None, y_full: np.ndarray = None
) -> dict:
    """
    Calcula métricas completas para un modelo.
    """
    y_pred = modelo.predict(X_test)
    y_prob = None
    try:
        y_prob = modelo.predict_proba(X_test)[:, 1]
    except Exception:
        pass

    metricas = {
        "accuracy":  round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1":        round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc":   round(roc_auc_score(y_test, y_prob), 4) if y_prob is not None else 0.0,
    }

    cm = confusion_matrix(y_test, y_pred)
    metricas["confusion_matrix"] = cm.tolist()

    # Cross-validation 5-fold si hay datos suficientes
    if X_full is not None and y_full is not None and len(y_full) >= CV_FOLDS * 2:
        try:
            cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
            cv_res = cross_validate(
                modelo, X_full, y_full, cv=cv,
                scoring=["accuracy", "f1", "roc_auc"],
                n_jobs=-1
            )
            metricas["cv_accuracy_mean"] = round(float(cv_res["test_accuracy"].mean()), 4)
            metricas["cv_f1_mean"]        = round(float(cv_res["test_f1"].mean()), 4)
            metricas["cv_roc_auc_mean"]   = round(float(cv_res["test_roc_auc"].mean()), 4)
        except Exception as e:
            logger.warning(f"CV omitido: {e}")

    return metricas


def comparar_modelos(
    modelos: dict, X_test: np.ndarray, y_test: np.ndarray,
    X_full: np.ndarray = None, y_full: np.ndarray = None
) -> dict:
    """
    Evalúa todos los modelos y devuelve comparación completa.
    """
    resultados = {}
    for nombre, modelo in modelos.items():
        try:
            resultados[nombre] = evaluar_modelo(modelo, X_test, y_test, X_full, y_full)
            logger.info(
                f"{nombre}: accuracy={resultados[nombre]['accuracy']} "
                f"f1={resultados[nombre]['f1']} "
                f"roc_auc={resultados[nombre]['roc_auc']}"
            )
        except Exception as e:
            logger.error(f"Error evaluando {nombre}: {e}")
    return resultados


def seleccionar_mejor_modelo(comparacion: dict) -> str:
    """
    Selecciona el modelo con mejor score combinado F1 + ROC-AUC.
    """
    if not comparacion:
        return None

    scores = {}
    for nombre, metricas in comparacion.items():
        # Peso: 50% F1 + 30% ROC-AUC + 20% accuracy
        score = (
            metricas.get("f1", 0)      * 0.5 +
            metricas.get("roc_auc", 0) * 0.3 +
            metricas.get("accuracy", 0)* 0.2
        )
        scores[nombre] = round(score, 4)

    ganador = max(scores, key=scores.get)
    logger.info(f"Modelo ganador: {ganador} (score={scores[ganador]})")
    return ganador