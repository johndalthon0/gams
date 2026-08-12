import decimal
import datetime
import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG
import logging

logger = logging.getLogger(__name__)

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="gam_pool",
            pool_size=5,
            **DB_CONFIG
        )
    return _pool

def get_connection():
    try:
        return get_pool().get_connection()
    except Exception as e:
        logger.error(f"Error conexión BD: {e}")
        raise

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
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        rows = cursor.fetchall()
        return [_normalizar_fila(r) for r in rows]  # ✅ siempre float
    finally:
        cursor.close()
        conn.close()

def execute_insert(query: str, params=None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def execute_update(query: str, params=None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        conn.commit()
        return cursor.rowcount
    finally:
        cursor.close()
        conn.close()