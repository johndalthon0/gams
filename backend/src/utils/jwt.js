const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      id:    user.id,
      email: user.email,
      rol:   user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };