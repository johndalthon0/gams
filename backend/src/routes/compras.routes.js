const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/compras.controller');

// Resumen
router.get('/resumen', auth, ctrl.getResumenCompras);

// Proveedores
router.get('/proveedores',        auth, ctrl.getProveedores);
router.post('/proveedores',       auth, ctrl.createProveedor);
router.put('/proveedores/:id',    auth, ctrl.updateProveedor);
router.delete('/proveedores/:id', auth, ctrl.deleteProveedor);

// Compras
router.get('/',              auth, ctrl.getCompras);
router.get('/:id',           auth, ctrl.getCompra);
router.post('/',             auth, ctrl.createCompra);
router.put('/:id/estado',    auth, ctrl.updateEstadoCompra);
router.delete('/:id',        auth, ctrl.deleteCompra);

module.exports = router;