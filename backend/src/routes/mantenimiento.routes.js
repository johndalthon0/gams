const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const role    = require('../middlewares/role.middleware');
const ctrl    = require('../controllers/mantenimiento.controller');

// ── Recursos ──────────────────────────────────────────────────
router.get('/equipos',                     auth, ctrl.getEquiposParaMantenimiento);
router.get('/repuestos',                   auth, ctrl.getRepuestos);
router.get('/reportes',                    auth, ctrl.getReportes);

// ── Solicitudes — ANTES de /:id ───────────────────────────────
router.get('/solicitudes',                 auth, ctrl.getSolicitudes);
router.post('/solicitudes',                auth, ctrl.createSolicitud);
router.get('/mis-solicitudes',             auth, ctrl.getMisSolicitudes);
router.put('/solicitudes/:id/reenviar',    auth, ctrl.reenviarSolicitud);
router.put('/solicitudes/:id',             auth, ctrl.editarSolicitud);

// ── Personal ──────────────────────────────────────────────────
router.get('/mis-mantenimientos',          auth, ctrl.getMisMantenimientos);
router.get('/mis-equipos',                 auth, ctrl.getMisEquipos);

// ── Notificaciones — ANTES de /:id ────────────────────────────
router.get('/notificaciones',              auth, ctrl.getNotificacionesUsuario);
router.put('/notificaciones/leer-todas',   auth, ctrl.marcarTodasLeidas);
router.put('/notificaciones/:id/leer',     auth, ctrl.marcarNotifLeida);

// ── Prefijos fijos — ANTES de /:id ────────────────────────────
router.put('/finalizar/:id',               auth, ctrl.finalizarMantenimiento);
router.put('/reasignar/:id',               auth, role('ADMIN'), ctrl.reasignarTecnico);

// ── CRUD ──────────────────────────────────────────────────────
router.get('/',                            auth, ctrl.getMantenimientos);
router.post('/',                           auth, ctrl.createMantenimiento);

// ── Acciones con /:id ─────────────────────────────────────────
router.get('/:id/historial',               auth, ctrl.getHistorialMant);
router.put('/:id/confirmar',               auth, ctrl.confirmarDisponibilidad);
router.put('/:id/reprogramar-admin',       auth, role('ADMIN'), ctrl.reprogramarAdmin);
router.put('/:id/reprogramar',             auth, ctrl.solicitarReprogramacion);
router.put('/:id/iniciar',                 auth, ctrl.iniciarMantenimiento);
router.put('/:id/pausar',                  auth, ctrl.pausarMantenimiento);
router.put('/:id/finalizar',               auth, ctrl.finalizarMantenimiento);

// ── GET individual — AL FINAL ─────────────────────────────────
router.get('/:id',                         auth, ctrl.getMantenimiento);

module.exports = router;