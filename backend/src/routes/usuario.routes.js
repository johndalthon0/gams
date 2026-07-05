const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const ctrl    = require('../controllers/usuario.controller');

<<<<<<< HEAD
=======
router.get('/mi-perfil',         auth, ctrl.getMiPerfil);
router.put('/mi-perfil',         auth, ctrl.updateMiPerfil);
>>>>>>> 56e24d21d6a03899f2a1b04099f4303a75129ffc
router.get('/toggle/:id',        auth, ctrl.toggleEstado);
router.get('/',                  auth, ctrl.getUsuarios);
router.post('/',                 auth, ctrl.createUsuario);
router.put('/toggle/:id',        auth, ctrl.toggleEstado);
router.put('/password/:id',      auth, ctrl.cambiarPassword);
router.put('/:id',               auth, ctrl.updateUsuario);
router.delete('/:id',            auth, ctrl.deleteUsuario);

module.exports = router;