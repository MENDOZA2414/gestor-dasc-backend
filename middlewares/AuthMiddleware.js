const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
  // Intenta obtener el token desde la cookie o el encabezado Authorization
  const cookieToken = req.cookies.token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: 'No hay sesión activa' });
  }

  try {
    // Verifica que el token sea válido y no esté expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validar que el sessionToken del JWT coincida con el de la base de datos
    const [result] = await pool.query(
      'SELECT sessionToken FROM User WHERE userID = ?',
      [decoded.id]
    );

    const sessionInDB = result[0]?.sessionToken;

    if (!sessionInDB || sessionInDB !== decoded.sessionToken) {
      return res.status(401).json({
        message: 'Sesión inválida o reemplazada desde otro dispositivo'
      });
    }

    req.user = decoded; // Se adjunta el usuario al request
    next();
  } catch (error) {
    const errorMsg =
      error.name === 'TokenExpiredError'
        ? 'Token expirado'
        : 'Token inválido o modificado';
    return res.status(401).json({ message: errorMsg });
  }
};

module.exports = authMiddleware;
