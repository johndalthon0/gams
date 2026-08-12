import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def limpiar_dataset(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    original = len(df)

    # Convertir fechas
    for col in ["fecha_inicio", "fecha_fin", "fecha_adquisicion",
                "fecha_mant_anterior"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    # Rellenar nulos numéricos con 0
    num_cols = ["costo_mant", "repuestos_cantidad", "repuestos_costo",
                "mant_previos", "correctivos_previos", "costo_promedio_previo",
                "costo_acumulado_previo"]
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Eliminar filas con equipo_id nulo
    df = df.dropna(subset=["equipo_id", "fecha_inicio"])

    # Eliminar costos negativos
    if "costo_mant" in df.columns:
        df = df[df["costo_mant"] >= 0]

    limpiados = original - len(df)
    if limpiados > 0:
        logger.info(f"Limpieza: {limpiados} filas eliminadas de {original}")

    return df.reset_index(drop=True)


def validar_dataset(df: pd.DataFrame, min_filas: int = 10) -> tuple[bool, str]:
    if df.empty:
        return False, "Dataset vacío"
    if len(df) < min_filas:
        return False, f"Solo {len(df)} filas — mínimo requerido: {min_filas}"
    if df["equipo_id"].nunique() < 2:
        return False, "Se necesitan al menos 2 equipos distintos"
    return True, "OK"