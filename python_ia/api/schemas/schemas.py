from pydantic import BaseModel
from typing import Optional, List, Any

class PropuestaAccion(BaseModel):
    orden_id:   int
    accion:     str
    usuario_id: int

class NotifLeer(BaseModel):
    notif_id: int