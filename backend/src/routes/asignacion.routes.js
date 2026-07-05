const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/asignacion.controller');

router.get('/usuarios',      auth, ctrl.getUsuarios);
router.get('/equipos',       auth, ctrl.getEquipos);
router.get('/catalogos',     auth, ctrl.getCatalogos);
router.get('/',              auth, ctrl.getAsignaciones);
router.post('/',             auth, ctrl.createAsignacion);
router.put('/devolver/:id',  auth, ctrl.devolver);

module.exports = router;