import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "user":     os.getenv("DB_USER",     "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME",     "gams_mantenimiento"),
    "port":     int(os.getenv("DB_PORT", 3306)),
}

# SSL: DB_SSL=true para MySQL en la nube (Aiven, TiDB). Railway proxy público = sin SSL.
if os.getenv("DB_SSL", "false").lower() == "true":
    DB_CONFIG["ssl_disabled"] = False
    _ca = os.getenv("DB_SSL_CA_PATH")
    if _ca:
        DB_CONFIG["ssl_ca"] = _ca
        DB_CONFIG["ssl_verify_cert"] = True
else:
    DB_CONFIG["ssl_disabled"] = True

PORT       = int(os.getenv("PORT", 5000))
MODELS_DIR = os.path.join(os.path.dirname(__file__), "trained_models")
LOGS_DIR   = os.path.join(os.path.dirname(__file__), "logs")

# Umbrales
UMBRAL_RIESGO_ALTO   = 0.70
UMBRAL_RIESGO_MEDIO  = 0.40
UMBRAL_ORDEN_AUTO    = 0.70   # genera orden automática
UMBRAL_NOTIFICACION  = 0.50   # genera notificación

# ML
CV_FOLDS         = 5
TEST_SIZE        = 0.25
RANDOM_STATE     = 42
MIN_FILAS_TRAIN  = 10   # mínimo de filas para entrenar