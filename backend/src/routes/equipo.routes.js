const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
  getEquipos,
  getMisEquipos,
  getEquipo,
  createEquipo,
  updateEquipo,
  darBajaEquipo
} = require('../controllers/equipo.controller');

router.get('/mis-equipos', auth, getMisEquipos); // ← antes de '/:id'
router.get('/',            auth, getEquipos);
router.get('/:id',         auth, getEquipo);
router.post('/',           auth, createEquipo);
router.put('/:id',         auth, updateEquipo);
router.put('/baja/:id',    auth, darBajaEquipo);

module.exports = router;