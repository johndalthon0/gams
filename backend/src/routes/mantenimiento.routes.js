const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const role    = require('../middlewares/role.middleware');
const ctrl    = require('../controllers/mantenimiento.controller');

router.get('/solicitudes',        auth, ctrl.getSolicitudes);
router.post('/solicitudes',       auth, ctrl.createSolicitud);
router.get('/mis-solicitudes',    auth, ctrl.getMisSolicitudes);
router.get('/equipos',            auth, ctrl.getEquiposParaMantenimiento);
router.get('/repuestos',          auth, ctrl.getRepuestos);
router.get('/reportes',           auth, ctrl.getReportes);

router.get('/',                   auth, ctrl.getMantenimientos);
router.post('/',                  auth, ctrl.createMantenimiento);
router.put('/finalizar/:id',      auth, ctrl.finalizarMantenimiento);
router.put('/reasignar/:id',      auth, role('ADMIN'), ctrl.reasignarTecnico); // ✅ solo admin
router.get('/:id',                auth, ctrl.getMantenimiento);

module.exports = router;