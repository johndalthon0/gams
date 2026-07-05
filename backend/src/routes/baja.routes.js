const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const role    = require('../middlewares/role.middleware');
const ctrl    = require('../controllers/baja.controller');

router.get('/estadisticas', auth, ctrl.getEstadisticas);
router.get('/',             auth, ctrl.getBajas);
router.get('/:id',          auth, ctrl.getBaja);
router.post('/',            auth, role('ADMIN'), ctrl.createBaja);

module.exports = router;