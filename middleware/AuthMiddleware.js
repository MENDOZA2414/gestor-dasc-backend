const jwt = require('jsonwebtoken');
const pool = require('../config/db'); 

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No hay sesión activa' }); 
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' }); 
  }
};

module.exports = authMiddleware;
