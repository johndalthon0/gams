import logging
import threading
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediccion    import router as pred_router, get_equipos_riesgo
from api.routes.entrenamiento import router as train_router, _estado as estado_entrenamiento
from api.routes.ordenes       import router as ord_router
from api.routes.notificaciones import router as notif_router
from pipeline.registry.model_registry import modelo_existe, get_version_activa
from config import PORT, IA_REFRESCO_HORA

ZONA_BO = ZoneInfo("America/La_Paz")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GAM — IA Predictiva",
    version="2.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pred_router,   prefix="/ia",              tags=["Predicción"])
app.include_router(train_router,  prefix="/ia",              tags=["Entrenamiento"])
app.include_router(ord_router,    prefix="/ia/ordenes",      tags=["Órdenes"])
app.include_router(notif_router,  prefix="/ia/notificaciones",tags=["Notificaciones"])

@app.on_event("startup")
def restaurar_modelo_al_arrancar():
    # El disco del contenedor es temporal -- en cada arranque se intenta
    # recuperar el ultimo modelo entrenado desde la BD antes de que llegue
    # la primera prediccion, para no servir el sintetico por defecto.
    try:
        if modelo_existe():
            logger.info(f"Modelo listo al arrancar: {get_version_activa()}")
        else:
            logger.info("Sin modelo entrenado todavia — se usara el sintético hasta el primer POST /ia/entrenar")
    except Exception as e:
        logger.warning(f"No se pudo verificar/restaurar el modelo al arrancar: {e}")

def _segundos_hasta_proxima_hora(hora: int) -> float:
    ahora = datetime.now(ZONA_BO)
    objetivo = ahora.replace(hour=hora, minute=0, second=0, microsecond=0)
    if objetivo <= ahora:
        objetivo += timedelta(days=1)
    return (objetivo - ahora).total_seconds()

def _loop_refresco_riesgo():
    # Antes, las predicciones solo se recalculaban cuando alguien tenía la
    # pantalla de IA abierta y el cache de 10 min ya había vencido -- si
    # nadie la abría, se quedaban pegadas en la última vez que alguien
    # entró. Este hilo las recalcula solo, una vez al día de madrugada,
    # haya alguien mirando o no (no reentrena el modelo, solo vuelve a
    # correrlo contra los datos actuales de cada equipo).
    while True:
        time.sleep(_segundos_hasta_proxima_hora(IA_REFRESCO_HORA))
        try:
            get_equipos_riesgo(guardar=True, refrescar=True)
            estado_entrenamiento["ultimo_refresco_auto"] = datetime.now(ZONA_BO).strftime("%Y-%m-%d %H:%M:%S")
            logger.info("Refresco automático diario de predicciones completado")
        except Exception as e:
            logger.warning(f"Refresco automático de riesgo falló: {e}")

@app.on_event("startup")
def iniciar_refresco_automatico():
    threading.Thread(target=_loop_refresco_riesgo, daemon=True).start()
    logger.info(f"Refresco automático de predicciones programado para las {IA_REFRESCO_HORA}:00 (La Paz)")

@app.get("/", tags=["Root"])
def root():
    return {"sistema": "GAM IA v2.0", "docs": "/docs", "estado": "activo"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)