import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.prediccion    import router as pred_router
from api.routes.entrenamiento import router as train_router
from api.routes.ordenes       import router as ord_router
from api.routes.notificaciones import router as notif_router
from config import PORT

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

@app.get("/", tags=["Root"])
def root():
    return {"sistema": "GAM IA v2.0", "docs": "/docs", "estado": "activo"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)