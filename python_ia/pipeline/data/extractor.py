import pandas as pd
from database import execute_query
import logging

logger = logging.getLogger(__name__)

def extraer_dataset_historial() -> pd.DataFrame:
    """
    Extrae UNA FILA POR MANTENIMIENTO con toda la información
    del equipo al momento del mantenimiento.
    Este es el cambio clave vs el enfoque anterior.
    """
    query = """
        SELECT
            m.id                                        AS mant_id,
            m.equipo_id,
            e.codigo                                    AS equipo_codigo,
            e.nombre                                    AS equipo_nombre,
            COALESCE(t.nombre, 'Sin tipo')              AS equipo_tipo,
            COALESCE(e.fecha_adquisicion, '2020-01-01') AS fecha_adquisicion,
            e.estado                                    AS equipo_estado,

            -- Datos del mantenimiento
            m.tipo                                      AS tipo_mant,
            m.estado                                    AS estado_mant,
            m.fecha_inicio,
            m.fecha_fin,
            COALESCE(m.costo, 0)                        AS costo_mant,

            -- Repuestos usados en este mantenimiento
            COALESCE((
                SELECT SUM(mr.cantidad)
                FROM mantenimiento_repuestos mr
                WHERE mr.mantenimiento_id = m.id
            ), 0)                                       AS repuestos_cantidad,

            COALESCE((
                SELECT SUM(mr.cantidad * mr.precio_unitario)
                FROM mantenimiento_repuestos mr
                WHERE mr.mantenimiento_id = m.id
            ), 0)                                       AS repuestos_costo,

            -- Contexto histórico hasta este mantenimiento (acumulado)
            (
                SELECT COUNT(*)
                FROM mantenimientos m2
                WHERE m2.equipo_id = m.equipo_id
                  AND m2.fecha_inicio < m.fecha_inicio
            )                                           AS mant_previos,

            (
                SELECT COUNT(*)
                FROM mantenimientos m2
                WHERE m2.equipo_id = m.equipo_id
                  AND m2.tipo = 'CORRECTIVO'
                  AND m2.fecha_inicio < m.fecha_inicio
            )                                           AS correctivos_previos,

            (
                SELECT COALESCE(AVG(m2.costo), 0)
                FROM mantenimientos m2
                WHERE m2.equipo_id = m.equipo_id
                  AND m2.fecha_inicio < m.fecha_inicio
                  AND m2.costo IS NOT NULL
            )                                           AS costo_promedio_previo,

            (
                SELECT COALESCE(SUM(m2.costo), 0)
                FROM mantenimientos m2
                WHERE m2.equipo_id = m.equipo_id
                  AND m2.fecha_inicio < m.fecha_inicio
            )                                           AS costo_acumulado_previo,

            (
                SELECT MAX(m2.fecha_inicio)
                FROM mantenimientos m2
                WHERE m2.equipo_id = m.equipo_id
                  AND m2.fecha_inicio < m.fecha_inicio
            )                                           AS fecha_mant_anterior

        FROM mantenimientos m
        JOIN equipos e      ON e.id = m.equipo_id
        LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
        WHERE m.estado IN ('FINALIZADO', 'EN_PROCESO')
        ORDER BY m.equipo_id, m.fecha_inicio
    """
    rows = execute_query(query)
    if not rows:
        logger.warning("Dataset vacío — no hay mantenimientos registrados")
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    logger.info(f"Dataset extraído: {len(df)} filas, {df['equipo_id'].nunique()} equipos únicos")
    return df


def extraer_equipos_activos() -> pd.DataFrame:
    """
    Para predicción: todos los equipos activos con su resumen actual.
    """
    query = """
        SELECT
            e.id                                        AS equipo_id,
            e.codigo                                    AS equipo_codigo,
            e.nombre                                    AS equipo_nombre,
            e.estado,
            COALESCE(t.nombre, 'Sin tipo')              AS equipo_tipo,
            COALESCE(e.fecha_adquisicion, '2020-01-01') AS fecha_adquisicion,

            COUNT(m.id)                                 AS total_mantenimientos,
            COALESCE(SUM(CASE WHEN m.tipo='CORRECTIVO' THEN 1 ELSE 0 END), 0)
                                                        AS total_correctivos,
            COALESCE(SUM(CASE WHEN m.tipo='PREVENTIVO' THEN 1 ELSE 0 END), 0)
                                                        AS total_preventivos,
            COALESCE(SUM(CASE WHEN m.estado='FINALIZADO' THEN 1 ELSE 0 END), 0)
                                                        AS total_finalizados,
            COALESCE(AVG(m.costo), 0)                   AS costo_promedio,
            COALESCE(MAX(m.costo), 0)                   AS max_costo,
            COALESCE(SUM(m.costo), 0)                   AS costo_total,
            MAX(m.fecha_inicio)                         AS ultimo_mantenimiento,
            MAX(CASE WHEN m.tipo='CORRECTIVO' THEN m.fecha_inicio END)
                                                        AS ultimo_correctivo,

            COALESCE(SUM(CASE
                WHEN m.fecha_inicio >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
                THEN 1 ELSE 0 END), 0)                  AS mant_ultimo_anio,

            COALESCE(SUM(CASE
                WHEN m.fecha_inicio >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
                THEN m.costo ELSE 0 END), 0)            AS costo_ultimo_anio,

            COALESCE((
                SELECT SUM(mr.cantidad)
                FROM mantenimiento_repuestos mr
                JOIN mantenimientos m2 ON m2.id = mr.mantenimiento_id
                WHERE m2.equipo_id = e.id
            ), 0)                                       AS repuestos_total,

            COALESCE((
                SELECT SUM(mr.cantidad * mr.precio_unitario)
                FROM mantenimiento_repuestos mr
                JOIN mantenimientos m2 ON m2.id = mr.mantenimiento_id
                WHERE m2.equipo_id = e.id
            ), 0)                                       AS costo_repuestos_total,

            COALESCE(AVG(
                TIMESTAMPDIFF(DAY, m.fecha_inicio, m.fecha_fin)
            ), 0)                                       AS duracion_promedio_dias

        FROM equipos e
        LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
        LEFT JOIN mantenimientos m ON m.equipo_id = e.id
        WHERE e.estado != 'BAJA'
        GROUP BY e.id, e.codigo, e.nombre, e.estado, t.nombre, e.fecha_adquisicion
        ORDER BY e.id
    """
    rows = execute_query(query)
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def get_responsable(equipo_id: int) -> int | None:
    responsable = execute_query("""
        SELECT usuario_id AS id FROM asignaciones
        WHERE equipo_id = %s AND estado = 1 LIMIT 1
    """, (equipo_id,))
    return responsable[0]["id"] if responsable else None