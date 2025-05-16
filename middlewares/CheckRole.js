const pool = require('../config/db');

/// Middleware que valida si el usuario tiene al menos uno de los roles requeridos
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userID = req.user.id;

      const [rows] = await pool.query(
        `SELECT r.roleName
         FROM UserRole ur
         JOIN Role r ON ur.roleID = r.roleID
         WHERE ur.userID = ?`,
        [userID]
      );

      const userRoles = rows.map(r => r.roleName);

      const hasAccess = allowedRoles.some(role => userRoles.includes(role));
      if (!hasAccess) {
        return res.status(403).json({ message: 'Acceso denegado. No tienes permisos suficientes.' });
      }

      next(); // El usuario tiene al menos un rol válido
    } catch (error) {
      console.error('Error en checkRole:', error.message);
      res.status(500).json({ message: 'Error al verificar roles' });
    }
  };
};

module.exports = checkRole;
