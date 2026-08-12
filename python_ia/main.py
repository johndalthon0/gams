import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediccion import router as pred_router
from api.routes.entrenamiento import router as train_router
from api.routes.ordenes import router as ord_router
from api.routes.notificaciones import router as notif_router

from config import PORT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GAM — IA Predictiva de Mantenimiento",
    description="""
    Módulo de Machine Learning para predicción de mantenimiento preventivo.
    Pipeline: Extracción → Feature Engineering → XGBoost/LightGBM/RF/GBM/ET
    → Evaluación → Selección automática → SHAP → Predicción → Notificaciones.
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# RUTAS
# ==========================

app.include_router(pred_router, prefix="/ia", tags=["Predicción"])
app.include_router(train_router, prefix="/ia", tags=["Entrenamiento"])

# Órdenes de trabajo
app.include_router(
    ord_router,
    prefix="/ia/ordenes",
    tags=["Órdenes y Trabajo"]
)

# Notificaciones
app.include_router(
    notif_router,
    prefix="/ia/notificaciones",
    tags=["Notificaciones"]
)

# ==========================

@app.get("/")
def root():
    return {
        "sistema": "GAM IA Predictiva v2.0",
        "docs": "http://localhost:5000/docs",
        "endpoints": [

            # IA
            "GET  /ia/equipos-riesgo",
            "GET  /ia/estadisticas",
            "GET  /ia/historial",
            "POST /ia/entrenar",
            "GET  /ia/versiones",

            # Órdenes
            "GET  /ia/ordenes/",
            "PUT  /ia/ordenes/accion",

            # Técnico
            "GET  /ia/ordenes/mis-ordenes/{usuario_id}",
            "PUT  /ia/ordenes/trabajo/accion",
            "POST /ia/ordenes/trabajo/repuesto",

            # Administrador
            "GET  /ia/ordenes/panel-admin",

            # Notificaciones
            "GET  /ia/notificaciones/{usuario_id}",
            "PUT  /ia/notificaciones/{id}/leer",
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True
    )