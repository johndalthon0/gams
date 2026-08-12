const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/inventario.controller');

// Resumen
router.get('/resumen', auth, ctrl.getResumen);

// Categorías
router.get('/categorias',        auth, ctrl.getCategorias);
router.post('/categorias',       auth, ctrl.createCategoria);
router.put('/categorias/:id',    auth, ctrl.updateCategoria);
router.delete('/categorias/:id', auth, ctrl.deleteCategoria);

// Productos
router.get('/',         auth, ctrl.getProductos);
router.get('/:id',      auth, ctrl.getProducto);
router.post('/',        auth, ctrl.createProducto);
router.put('/:id',      auth, ctrl.updateProducto);
router.delete('/:id',   auth, ctrl.deleteProducto);

// Movimientos
router.get('/movimientos/historial', auth, ctrl.getMovimientos);
router.post('/movimientos/entrada',  auth, ctrl.registrarEntrada);
router.post('/movimientos/salida',   auth, ctrl.registrarSalida);
router.post('/movimientos/ajuste',   auth, ctrl.registrarAjuste);

module.exports = router;