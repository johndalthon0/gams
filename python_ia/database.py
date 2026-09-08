import decimal
import datetime
import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG
import logging

logger = logging.getLogger(__name__)

_pool = None

# connection_timeout: falla rápido si el proxy de Railway no responde,
# en vez de dejar la petición colgada indefinidamente.
_CONN_CFG = {**DB_CONFIG, "connection_timeout": 10}

def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="gam_pool",
            pool_size=6,
            **_CONN_CFG
        )
    return _pool

def get_connection():
    try:
        return get_pool().get_connection()
    except Exception as e:
        logger.warning(f"Pool no disponible ({e}) — conexión directa")
        return mysql.connector.connect(**_CONN_CFG)

def _reset_pool():
    global _pool
    _pool = None

def _run(hacer):
    """
    Ejecuta `hacer(conn)` con reintento: el proxy de Railway cierra
    conexiones ociosas y las del pool quedan muertas tras un rato dormido.
    """
    for intento in (1, 2):
        conn = get_connection()
        try:
            return hacer(conn)
        except mysql.connector.Error as e:
            if intento == 1 and getattr(e, "errno", None) in (2006, 2013, 2055, 2003):
                logger.warning(f"Conexión perdida ({e}) — reintentando con pool nuevo")
                _reset_pool()
                continue
            raise
        finally:
            try:
                conn.close()
            except Exception:
                pass

# ✅ Conversión centralizada de tipos MySQL → Python nativo
def _convertir_valor(v):
    if isinstance(v, decimal.Decimal):
        return float(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v  # pandas maneja estos bien
    return v

def _normalizar_fila(fila: dict) -> dict:
    return {k: _convertir_valor(v) for k, v in fila.items()}

def execute_query(query: str, params=None) -> list:
    def hacer(conn):
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            return [_normalizar_fila(r) for r in rows]
        finally:
            cursor.close()
    return _run(hacer)

def execute_insert(query: str, params=None) -> int:
    def hacer(conn):
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
    return _run(hacer)

def execute_update(query: str, params=None) -> int:
    def hacer(conn):
        cursor = conn.cursor()
        try:
            cursor.execute(query, params or ())
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
    return _run(hacer)