import numpy as np
import logging
from pipeline.features.engineer import FEATURE_COLS

logger = logging.getLogger(__name__)

try:
    import shap
    SHAP_OK = True
except ImportError:
    SHAP_OK = False
    logger.warning("SHAP no instalado — pip install shap")


def _get_explainer(modelo, X_background: np.ndarray, nombre_modelo: str):
    """
    Selecciona el explainer correcto según el tipo de modelo.
    """
    nombre = nombre_modelo.lower()

    # Tree-based: todos soportados nativamente por TreeExplainer
    tree_models = ("randomforest", "gradientboosting", "extratrees",
                   "xgboost", "lightgbm", "xgbclassifier", "lgbmclassifier")
    if any(t in nombre for t in tree_models):
        return shap.TreeExplainer(modelo)

    # Fallback: KernelExplainer (más lento pero universal)
    background = shap.kmeans(X_background, min(10, len(X_background)))
    return shap.KernelExplainer(modelo.predict_proba, background)


def calcular_shap_equipo(
    modelo,
    X_equipo: np.ndarray,
    nombre_modelo: str,
    X_background: np.ndarray = None
) -> dict:
    """
    Calcula SHAP values para UN equipo.
    Devuelve {feature: shap_value} ordenado por importancia absoluta.
    X_equipo debe ser shape (1, n_features).
    """
    if X_equipo.ndim == 1:
        X_equipo = X_equipo.reshape(1, -1)

    n_features = X_equipo.shape[1]
    cols = FEATURE_COLS[:n_features]

    # ── Intento con SHAP ──
    if SHAP_OK:
        try:
            bg = X_background if X_background is not None else X_equipo
            explainer   = _get_explainer(modelo, bg, nombre_modelo)
            shap_values = explainer.shap_values(X_equipo)

            # shap_values puede ser:
            # - ndarray (n_samples, n_features)           → regresión / XGBoost binario
            # - list[ndarray, ndarray]                    → RF/GBM binario (clase 0 y 1)
            # - ndarray (n_samples, n_features, n_classes) → multiclase
            if isinstance(shap_values, list):
                # clasificación binaria → tomar clase positiva (índice 1)
                vals = np.array(shap_values[1]).flatten()
            elif isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 3:
                    # (samples, features, classes) → clase positiva
                    vals = shap_values[0, :, 1]
                elif shap_values.ndim == 2:
                    vals = shap_values[0]
                else:
                    vals = shap_values
            else:
                vals = np.array(shap_values).flatten()

            vals = vals[:n_features]
            resultado = {cols[i]: round(float(vals[i]), 6)
                         for i in range(len(cols))}
            return dict(sorted(resultado.items(),
                               key=lambda x: abs(x[1]), reverse=True))

        except Exception as e:
            logger.warning(f"SHAP falló ({e}) — usando Feature Importance")

    # ── Fallback: Feature Importance del modelo ──
    return _feature_importance_fallback(modelo, cols)


def _feature_importance_fallback(modelo, cols: list) -> dict:
    try:
        imp = modelo.feature_importances_
        resultado = {
            cols[i]: round(float(imp[i]), 6)
            for i in range(min(len(cols), len(imp)))
        }
        return dict(sorted(resultado.items(),
                            key=lambda x: abs(x[1]), reverse=True))
    except Exception as e:
        logger.error(f"Feature Importance también falló: {e}")
        return {c: 0.0 for c in cols}


def generar_explicacion_texto(
    shap_dict: dict,
    probabilidad: float,
    nivel_riesgo: str,
    dias: int,
    anomalia: bool,
    row_datos: dict
) -> dict:
    LABELS = {
        "dias_desde_adquisicion":       "Antigüedad del equipo",
        "total_mantenimientos":         "Total de mantenimientos registrados",
        "total_correctivos":            "Mantenimientos correctivos (fallas)",
        "pct_correctivos":              "Porcentaje de mantenimientos correctivos",
        "pct_preventivos":              "Porcentaje de mantenimientos preventivos",
        "pct_finalizados":              "Porcentaje finalizados",
        "costo_promedio":               "Costo promedio de reparación",
        "max_costo":                    "Costo máximo de un mantenimiento",
        "costo_total":                  "Costo total acumulado",
        "costo_ultimo_anio":            "Costo en el último año",
        "ratio_costo_edad":             "Costo por año de vida del equipo",
        "tendencia_costo":              "Tendencia del costo (sube o baja)",
        "mant_ultimo_anio":             "Mantenimientos en el último año",
        "frec_mantenimiento_anio":      "Frecuencia de mantenimiento anual",
        "dias_sin_mantenimiento":       "Días sin mantenimiento",
        "dias_desde_ultimo_correctivo": "Días desde el último correctivo",
        "repuestos_total":              "Repuestos utilizados en total",
        "costo_repuestos_total":        "Costo total de repuestos",
        "duracion_promedio_dias":       "Duración promedio de reparaciones",
        "tipo_codificado":              "Tipo de equipo",
        "estado_codificado":            "Estado actual del equipo",
    }

    factores = []
    for feature, valor_shap in list(shap_dict.items())[:8]:
        impacto = (
            "alto"  if abs(valor_shap) >= 0.10 else
            "medio" if abs(valor_shap) >= 0.03 else
            "bajo"
        )
        val_real = row_datos.get(feature, 0.0)
        if isinstance(val_real, float):
            if "pct" in feature:
                val_fmt = f"{round(val_real * 100, 1)}%"
            elif "costo" in feature or "ratio" in feature:
                val_fmt = f"Bs {val_real:,.2f}"
            elif "dias" in feature:
                val_fmt = f"{int(val_real)} días"
            else:
                val_fmt = f"{round(val_real, 2)}"
        else:
            val_fmt = str(val_real)

        factores.append({
            "feature":   feature,
            "label":     LABELS.get(feature, feature.replace("_", " ").title()),
            "valor":     val_fmt,
            "shap":      valor_shap,
            "impacto":   impacto,
            "direccion": "aumenta riesgo" if valor_shap > 0 else "reduce riesgo",
        })

    n_altos  = sum(1 for f in factores if f["impacto"] == "alto")
    n_medios = sum(1 for f in factores if f["impacto"] == "medio")
    conclusion = (
        f"La IA analizó {len(shap_dict)} variables. "
        f"Con {n_altos} factores de impacto alto y {n_medios} medio, "
        f"estima {round(probabilidad, 1)}% de probabilidad de falla. "
    )
    if anomalia:
        conclusion += "Se detectó comportamiento anómalo (Isolation Forest). "
    conclusion += f"Nivel: {nivel_riesgo}. Intervención recomendada en {dias} días."

    return {
        "factores":   factores,
        "conclusion": conclusion,
        "resumen": {
            "prob_pct":     round(probabilidad, 1),
            "nivel":        nivel_riesgo,
            "dias":         dias,
            "anomalia":     anomalia,
            "n_factores":   len(factores),
        }
    }