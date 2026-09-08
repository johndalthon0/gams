import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import execute_query, execute_update, execute_insert

logger = logging.getLogger(__name__)
router = APIRouter()


class RespuestaNotif(BaseModel):
    notif_id:   int
    respuesta:  str   # APROBADA | RECHAZADA
    usuario_id: int


def _serializar(rows: list) -> list:
    for r in rows:
        for k, v in list(r.items()):
            if hasattr(v, "isoformat"):
                r[k] = str(v)
            if k == "datos_json" and isinstance(v, str):
                try:
                    r[k] = json.loads(v)
                except Exception:
                    pass
    return rows


@router.get("/{usuario_id}")
def get_notificaciones(usuario_id: int, limit: int = 30):
    try:
        rows = execute_query("""
            SELECT id, usuario_id, tipo, titulo, mensaje,
                   leida, fecha, datos_json,
                   respuesta, respondida,
                   referencia_id, referencia_tipo
            FROM notificaciones
            WHERE usuario_id = %s
            ORDER BY fecha DESC
            LIMIT %s
        """, (usuario_id, limit))
        no_leidas   = sum(1 for r in rows if not r.get("leida"))
        pendientes  = sum(1 for r in rows if r.get("respondida") == 0
                          and r.get("tipo") in ("SOLICITUD_MANT", "IA_RIESGO"))
        return {
            "notificaciones": _serializar(rows),
            "total":          len(rows),
            "no_leidas":      no_leidas,
            "pendientes_resp":pendientes,
        }
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))


@router.put("/{notif_id}/leer")
def marcar_leida(notif_id: int):
    try:
        execute_update(
            "UPDATE notificaciones SET leida=1 WHERE id=%s", (notif_id,)
        )
        return {"message": "Notificación marcada como leída"}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.put("/leer-todas/{usuario_id}")
def leer_todas(usuario_id: int):
    try:
        execute_update(
            "UPDATE notificaciones SET leida=1 WHERE usuario_id=%s", (usuario_id,)
        )
        return {"message": "Todas leídas"}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.put("/responder")
def responder_notificacion(data: RespuestaNotif):
    """
    El personal aprueba o rechaza una solicitud de mantenimiento.
    Si aprueba: actualiza la orden/mantenimiento relacionado.
    Si rechaza: lo registra y notifica al admin.
    """
    if data.respuesta not in ("APROBADA", "RECHAZADA"):
        raise HTTPException(400, detail="Respuesta debe ser APROBADA o RECHAZADA")
    try:
        # Marcar notificación como respondida
        execute_update("""
            UPDATE notificaciones
            SET leida=1, respondida=1, respuesta=%s
            WHERE id=%s AND usuario_id=%s
        """, (data.respuesta, data.notif_id, data.usuario_id))

        # Obtener datos de la notificación
        notif = execute_query(
            "SELECT * FROM notificaciones WHERE id=%s", (data.notif_id,)
        )
        if not notif:
            raise HTTPException(404, detail="Notificación no encontrada")
        notif = notif[0]

        datos = notif.get("datos_json") or {}
        if isinstance(datos, str):
            try:
                datos = json.loads(datos)
            except Exception:
                datos = {}

        equipo_id    = datos.get("equipo_id")
        orden_trab_id = datos.get("orden_trabajo_id")
        tipo_notif   = notif.get("referencia_tipo") or notif.get("tipo")

        # Obtener info del usuario que responde
        usuario = execute_query(
            "SELECT nombre, apellido FROM usuarios WHERE id=%s", (data.usuario_id,)
        )
        nombre_usuario = f"{usuario[0]['nombre']} {usuario[0].get('apellido','')}" if usuario else "Usuario"

        # Obtener info del equipo
        equipo_info = None
        if equipo_id:
            eq = execute_query(
                "SELECT codigo, nombre FROM equipos WHERE id=%s", (equipo_id,)
            )
            equipo_info = eq[0] if eq else None

        cod = equipo_info["codigo"] if equipo_info else "—"
        nom = equipo_info["nombre"] if equipo_info else "—"

        # Notificar al admin sobre la respuesta
        admins = execute_query("""
            SELECT DISTINCT u.id FROM usuarios u
            JOIN usuario_roles ur ON ur.usuario_id=u.id
            JOIN roles r ON r.id=ur.rol_id
            WHERE r.nombre='ADMIN' AND u.estado=1
        """)

        if data.respuesta == "APROBADA":
            if orden_trab_id:
                execute_update("""
                    UPDATE ia_ordenes_trabajo
                    SET estado='PROGRAMADO'
                    WHERE id=%s
                """, (orden_trab_id,))
                execute_update("""
                    UPDATE mantenimientos
                    SET estado='PROGRAMADO'
                    WHERE id=(SELECT mantenimiento_id FROM ia_ordenes_trabajo WHERE id=%s)
                """, (orden_trab_id,))

            for admin in admins:
                execute_insert("""
                    INSERT INTO notificaciones
                        (usuario_id, tipo, titulo, mensaje, leida, datos_json,
                         referencia_id, referencia_tipo)
                    VALUES (%s,'RESP_PERSONAL',%s,%s,0,%s,%s,'ORDEN_TRABAJO')
                """, (
                    admin["id"],
                    f"✅ {nombre_usuario} aprobó el mantenimiento de {cod}",
                    f"El usuario {nombre_usuario} confirmó disponibilidad para "
                    f"el mantenimiento del equipo {cod} — {nom}. "
                    f"El equipo estará disponible en la fecha programada.",
                    json.dumps(datos, default=str),
                    orden_trab_id
                ))

        else:
            if orden_trab_id:
                execute_update("""
                    UPDATE ia_ordenes_trabajo
                    SET estado='PAUSADO',
                        observaciones=CONCAT(COALESCE(observaciones,''),
                            ' | Rechazado por responsable: ', %s)
                    WHERE id=%s
                """, (nombre_usuario, orden_trab_id))
                execute_update("""
                    UPDATE mantenimientos
                    SET estado='REPROGRAMAR', motivo_reprogramar=%s
                    WHERE id=(SELECT mantenimiento_id FROM ia_ordenes_trabajo WHERE id=%s)
                """, (f"Rechazado por {nombre_usuario}", orden_trab_id))

            for admin in admins:
                execute_insert("""
                    INSERT INTO notificaciones
                        (usuario_id, tipo, titulo, mensaje, leida, datos_json,
                         referencia_id, referencia_tipo)
                    VALUES (%s,'RESP_PERSONAL',%s,%s,0,%s,%s,'ORDEN_TRABAJO')
                """, (
                    admin["id"],
                    f"❌ {nombre_usuario} rechazó el mantenimiento de {cod}",
                    f"El usuario {nombre_usuario} rechazó la solicitud de mantenimiento "
                    f"para el equipo {cod} — {nom}. "
                    f"Se requiere intervención del administrador para reprogramar.",
                    json.dumps(datos, default=str),
                    orden_trab_id
                ))

        return {
            "message":  f"Respuesta registrada: {data.respuesta}",
            "respuesta": data.respuesta,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(e)
        raise HTTPException(500, detail=str(e))