const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/repuesto.controller');

router.get('/mas-usados',  auth, ctrl.getMasUsados);
router.get('/por-equipo',  auth, ctrl.getPorEquipo);
router.get('/stock',       auth, ctrl.getStock);
router.get('/totales',     auth, ctrl.getTotales);

module.exports = router;