const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/configuracion.controller');

router.get('/perfil',    auth, ctrl.getMiPerfil);
router.put('/perfil',    auth, ctrl.updateMiPerfil);
router.put('/password',  auth, ctrl.cambiarMiPassword);

module.exports = router;