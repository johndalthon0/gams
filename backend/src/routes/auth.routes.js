const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { register, login, getPerfil } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login',    login);
router.get('/perfil',    auth, getPerfil);  // ← protegida

module.exports = router;