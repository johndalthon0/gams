const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Token requerido' });

  // Acepta "Bearer <token>" y token crudo
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, rol }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};