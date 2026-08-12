const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/ia.controller');

// ============================
// Predicción
// ============================
router.get('/equipos-riesgo',            auth, ctrl.getEquiposRiesgo);
router.get('/estadisticas',              auth, ctrl.getEstadisticas);
router.get('/historial',                 auth, ctrl.getHistorial);

// ============================
// Entrenamiento
// ============================
router.post('/entrenar',                 auth, ctrl.entrenar);
router.get('/versiones',                 auth, ctrl.getVersiones);
router.get('/estado-entrenamiento',      auth, ctrl.getEstadoEntrenamiento);

// ============================
// Órdenes
// ============================
router.get('/ordenes',                   auth, ctrl.getOrdenes);
router.put('/ordenes/accion',            auth, ctrl.accionarOrden);

// Bandeja del técnico
router.get('/mis-ordenes',               auth, ctrl.getMisOrdenes);

// Trabajo del técnico
router.put('/ordenes/trabajo/accion',    auth, ctrl.accionOrdenTrabajo);
router.post('/ordenes/trabajo/repuesto', auth, ctrl.agregarRepuestoOrden);

// Panel administrador
router.get('/panel-admin',               auth, ctrl.getPanelAdmin);

// ============================
// Notificaciones
// ============================
router.get('/notificaciones',            auth, ctrl.getNotificaciones);
router.put('/notificaciones/:id/leer',   auth, ctrl.marcarLeida);
router.put('/notificaciones/leer-todas', auth, ctrl.leerTodas);
// Agregar esta línea al archivo existente:
router.put('/notificaciones/responder', auth, ctrl.responderNotificacion);

module.exports = router;