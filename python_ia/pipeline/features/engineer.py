import pandas as pd
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

FEATURE_COLS = [
    "dias_desde_adquisicion",
    "total_mantenimientos",
    "total_correctivos",
    "pct_correctivos",
    "total_preventivos",
    "pct_preventivos",
    "pct_finalizados",
    "costo_promedio",
    "max_costo",
    "costo_total",
    "costo_ultimo_anio",
    "ratio_costo_edad",
    "tendencia_costo",
    "mant_ultimo_anio",
    "frec_mantenimiento_anio",
    "dias_sin_mantenimiento",
    "dias_desde_ultimo_correctivo",
    "repuestos_total",
    "costo_repuestos_total",
    "duracion_promedio_dias",
    "tipo_codificado",
    "estado_codificado",
]

TIPO_MAP = {
    "laptop": 0, "pc": 1, "impresora": 2, "monitor": 3,
    "servidor": 4, "tablet": 5, "sin tipo": 6
}
ESTADO_MAP = {"disponible": 0, "asignado": 1, "mantenimiento": 2}

# ✅ Columnas numéricas que vienen de la BD
_NUMERIC_COLS_RESUMEN = [
    "total_mantenimientos", "total_correctivos", "total_preventivos",
    "total_finalizados", "costo_promedio", "max_costo", "costo_total",
    "costo_ultimo_anio", "mant_ultimo_anio", "repuestos_total",
    "costo_repuestos_total", "duracion_promedio_dias",
]
_NUMERIC_COLS_HISTORIAL = [
    "costo_mant", "repuestos_cantidad", "repuestos_costo",
    "mant_previos", "correctivos_previos",
    "costo_promedio_previo", "costo_acumulado_previo",
]


def _forzar_float(df: pd.DataFrame, cols: list) -> pd.DataFrame:
    """
    Convierte a float todas las columnas numéricas del DataFrame.
    Centralizado aquí para no repetir pd.to_numeric en cada feature.
    """
    for col in cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype(float).fillna(0.0)
    return df


def _dias_desde(fecha) -> float:
    if pd.isna(fecha) or fecha is None:
        return float(365 * 3)
    try:
        if not isinstance(fecha, datetime):
            fecha = pd.to_datetime(fecha)
        diff = (datetime.now() - fecha.replace(tzinfo=None)).days
        return float(max(diff, 0))
    except Exception:
        return float(365 * 3)


def construir_features_desde_resumen(df: pd.DataFrame) -> pd.DataFrame:
    """
    Toma el dataframe de equipos activos y construye el vector de features
    para predicción. Todas las columnas numéricas se fuerzan a float primero.
    """
    # ✅ Paso 1: forzar tipos antes de cualquier operación
    df = df.copy()
    df = _forzar_float(df, _NUMERIC_COLS_RESUMEN)

    f = pd.DataFrame(index=df.index)
    f["equipo_id"] = df["equipo_id"]

    # Antigüedad
    f["dias_desde_adquisicion"] = df["fecha_adquisicion"].apply(_dias_desde)

    # Conteos base
    f["total_mantenimientos"] = df["total_mantenimientos"]
    f["total_correctivos"]    = df["total_correctivos"]
    f["total_preventivos"]    = df["total_preventivos"]
    f["mant_ultimo_anio"]     = df["mant_ultimo_anio"]

    # Porcentajes — divisor seguro float
    total_safe = f["total_mantenimientos"].replace(0.0, 1.0)
    f["pct_correctivos"] = f["total_correctivos"] / total_safe
    f["pct_preventivos"] = f["total_preventivos"] / total_safe
    f["pct_finalizados"] = df["total_finalizados"] / total_safe

    # Costos
    f["costo_promedio"]        = df["costo_promedio"]
    f["max_costo"]             = df["max_costo"]
    f["costo_total"]           = df["costo_total"]
    f["costo_ultimo_anio"]     = df["costo_ultimo_anio"]
    f["repuestos_total"]       = df["repuestos_total"]
    f["costo_repuestos_total"] = df["costo_repuestos_total"]
    f["duracion_promedio_dias"]= df["duracion_promedio_dias"]

    # Ratio costo/edad
    anios = (f["dias_desde_adquisicion"] / 365.0).replace(0.0, 0.1)
    f["ratio_costo_edad"] = f["costo_total"] / anios

    # Tendencia de costo
    costo_hist = f["costo_promedio"].replace(0.0, 1.0)
    f["tendencia_costo"] = (
        (f["costo_ultimo_anio"] - f["costo_promedio"]) / costo_hist
    ).clip(-5.0, 5.0)

    # Frecuencia de mantenimiento anual
    f["frec_mantenimiento_anio"] = f["total_mantenimientos"] / anios

    # Días sin mantenimiento
    f["dias_sin_mantenimiento"] = df["ultimo_mantenimiento"].apply(_dias_desde)

    # Días desde último correctivo
    col_ult_corr = "ultimo_correctivo" if "ultimo_correctivo" in df.columns else "ultimo_mantenimiento"
    f["dias_desde_ultimo_correctivo"] = df[col_ult_corr].apply(_dias_desde)

    # Encodings categóricos → float
    f["tipo_codificado"] = (
        df["equipo_tipo"].str.lower()
        .map(lambda x: float(TIPO_MAP.get(x, 6)))
    )
    f["estado_codificado"] = (
        df["estado"].str.lower()
        .map(lambda x: float(ESTADO_MAP.get(x, 0)))
        .fillna(0.0)
    )

    # ✅ Paso final: garantizar que TODO el DataFrame sea float64
    for col in FEATURE_COLS:
        if col in f.columns:
            f[col] = pd.to_numeric(f[col], errors="coerce").astype(float).fillna(0.0)

    logger.info(f"Features construidas: {len(FEATURE_COLS)} vars, {len(f)} equipos")
    return f


def construir_features_para_entrenamiento(df: pd.DataFrame) -> pd.DataFrame:
    """
    Toma el historial de mantenimientos y construye features + etiqueta.
    """
    df = df.copy()
    df = _forzar_float(df, _NUMERIC_COLS_HISTORIAL)

    f = pd.DataFrame(index=df.index)
    f["equipo_id"] = df["equipo_id"]

    f["dias_desde_adquisicion"] = df["fecha_adquisicion"].apply(_dias_desde)

    f["total_mantenimientos"] = df["mant_previos"]
    f["total_correctivos"]    = df["correctivos_previos"]
    f["total_preventivos"]    = (f["total_mantenimientos"] - f["total_correctivos"]).clip(lower=0.0)
    f["mant_ultimo_anio"]     = f["total_mantenimientos"].apply(lambda x: min(x, 12.0))

    total_safe = f["total_mantenimientos"].replace(0.0, 1.0)
    f["pct_correctivos"] = f["total_correctivos"] / total_safe
    f["pct_preventivos"] = f["total_preventivos"] / total_safe
    f["pct_finalizados"] = pd.Series(1.0, index=df.index)

    f["costo_promedio"]        = df["costo_promedio_previo"]
    f["max_costo"]             = df["costo_promedio_previo"]
    f["costo_total"]           = df["costo_acumulado_previo"]
    f["costo_ultimo_anio"]     = f["costo_total"] * 0.4
    f["repuestos_total"]       = df["repuestos_cantidad"]
    f["costo_repuestos_total"] = df["repuestos_costo"]

    f["duracion_promedio_dias"] = df.apply(
        lambda row: float(max(
            (pd.to_datetime(row["fecha_fin"]) - pd.to_datetime(row["fecha_inicio"])).days, 0
        )) if pd.notna(row.get("fecha_fin")) and pd.notna(row.get("fecha_inicio")) else 0.0,
        axis=1
    )

    anios = (f["dias_desde_adquisicion"] / 365.0).replace(0.0, 0.1)
    f["ratio_costo_edad"]        = f["costo_total"] / anios
    f["tendencia_costo"]         = ((f["costo_ultimo_anio"] / f["costo_total"].replace(0.0, 1.0)) - 0.3).clip(-5.0, 5.0)
    f["frec_mantenimiento_anio"] = f["total_mantenimientos"] / anios

    f["dias_sin_mantenimiento"] = df["fecha_mant_anterior"].apply(
        lambda x: _dias_desde(x) if pd.notna(x) else 365.0
    )
    f["dias_desde_ultimo_correctivo"] = f["dias_sin_mantenimiento"]

    f["tipo_codificado"] = (
        df["equipo_tipo"].str.lower()
        .map(lambda x: float(TIPO_MAP.get(x, 6)))
    )
    f["estado_codificado"] = (
        df["equipo_estado"].str.lower()
        .map(lambda x: float(ESTADO_MAP.get(x, 0)))
        .fillna(0.0)
    )

    # Etiqueta: 1 = CORRECTIVO (falla), 0 = PREVENTIVO
    f["etiqueta"] = (df["tipo_mant"] == "CORRECTIVO").astype(int)

    # ✅ Garantizar float64 en todo el DataFrame
    for col in FEATURE_COLS:
        if col in f.columns:
            f[col] = pd.to_numeric(f[col], errors="coerce").astype(float).fillna(0.0)

    positivos = int(f["etiqueta"].sum())
    negativos = int((f["etiqueta"] == 0).sum())
    logger.info(f"Dataset: {len(f)} filas | positivos={positivos} | negativos={negativos}")
    return f