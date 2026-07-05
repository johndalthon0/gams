// Middleware de restricción por rol
module.exports = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: 'No autenticado' });

    if (!rolesPermitidos.includes(req.user.rol))
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });

    next();
  };
};