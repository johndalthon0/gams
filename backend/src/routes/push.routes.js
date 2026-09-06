const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth.middleware');
const role    = require('../middlewares/role.middleware');
const ctrl    = require('../controllers/push.controller');

router.get('/clave-publica',  (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ publicKey, habilitado: !!publicKey });
});
router.get('/estado',         auth, ctrl.estado);
router.post('/suscribir',     auth, ctrl.suscribir);
router.delete('/desuscribir', auth, ctrl.desuscribir);
router.post('/test',          auth, ctrl.testPush);
router.post('/broadcast',     auth, role('ADMIN'), ctrl.broadcast);

module.exports = router;