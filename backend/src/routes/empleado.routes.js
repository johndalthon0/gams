const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/empleado.controller');

// ✅ rutas específicas ANTES de /:id
router.get('/sucursales', auth, ctrl.getSucursales);
router.get('/cargos',     auth, ctrl.getCargos);
router.get('/areas',      auth, ctrl.getAreas);
router.get('/roles',      auth, ctrl.getRoles);
router.get('/tecnicos',   auth, ctrl.getTecnicos);

router.get('/',           auth, ctrl.getEmpleados);
router.post('/',          auth, ctrl.createEmpleado);
router.put('/toggle/:id', auth, ctrl.toggleEstado);
router.delete('/:id',     auth, ctrl.deleteEmpleado);

module.exports = router;