const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/catalogo.controller');

// =============================================
// SUCURSALES
// =============================================
router.get('/sucursales',       auth, ctrl.getSucursales);
router.post('/sucursales',      auth, ctrl.createSucursal);
router.put('/sucursales/:id',   auth, ctrl.updateSucursal);
router.delete('/sucursales/:id',auth, ctrl.deleteSucursal);

// =============================================
// AREAS
// =============================================
router.get('/areas',       auth, ctrl.getAreas);
router.post('/areas',      auth, ctrl.createArea);
router.put('/areas/:id',   auth, ctrl.updateArea);
router.delete('/areas/:id',auth, ctrl.deleteArea);

// =============================================
// CARGOS
// =============================================
router.get('/cargos',       auth, ctrl.getCargos);
router.post('/cargos',      auth, ctrl.createCargo);
router.put('/cargos/:id',   auth, ctrl.updateCargo);
router.delete('/cargos/:id',auth, ctrl.deleteCargo);

// =============================================
// TIPOS EQUIPO
// =============================================
router.get('/tipos',       auth, ctrl.getTipos);
router.post('/tipos',      auth, ctrl.createTipo);
router.put('/tipos/:id',   auth, ctrl.updateTipo);
router.delete('/tipos/:id',auth, ctrl.deleteTipo);

// =============================================
// LUGARES
// =============================================
router.get('/lugares',       auth, ctrl.getLugares);
router.post('/lugares',      auth, ctrl.createLugar);
router.put('/lugares/:id',   auth, ctrl.updateLugar);
router.delete('/lugares/:id',auth, ctrl.deleteLugar);

// =============================================
// REPUESTOS
// =============================================
router.get('/repuestos',       auth, ctrl.getRepuestos);
router.post('/repuestos',      auth, ctrl.createRepuesto);
router.put('/repuestos/:id',   auth, ctrl.updateRepuesto);
router.delete('/repuestos/:id',auth, ctrl.deleteRepuesto);

module.exports = router;