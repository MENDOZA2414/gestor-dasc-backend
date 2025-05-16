const pool = require('../config/db');

/// Middleware que valida si el usuario tiene uno de los userType permitidos (ej: 'student', 'company', etc.)
const checkUserType = (allowedTypes) => {
  return async (req, res, next) => {
    try {
      const userID = req.user.id;

      // Obtener el userTypeName real desde la base de datos
      const [rows] = await pool.query(
        `SELECT ut.userTypeName
         FROM User u
         JOIN UserType ut ON u.userTypeID = ut.userTypeID
         WHERE u.userID = ?`,
        [userID]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado o sin tipo de usuario asignado' });
      }

      const userTypeName = rows[0].userTypeName;

      if (!allowedTypes.includes(userTypeName)) {
        return res.status(403).json({ message: 'Acceso denegado. No tienes el tipo de usuario adecuado.' });
      }

      next();
    } catch (error) {
      console.error('Error en checkUserType:', error.message);
      res.status(500).json({ message: 'Error al validar el tipo de usuario' });
    }
  };
};

module.exports = checkUserType;
