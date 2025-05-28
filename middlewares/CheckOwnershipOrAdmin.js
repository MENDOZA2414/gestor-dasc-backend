const pool = require('../config/db');

/// Middleware reutilizable para permitir acceso solo si el usuario es dueño del recurso o tiene rol Admin/SuperAdmin
/// - `getOwnerIDFromParams` debe ser una función async que retorne el userID del dueño real del recurso (desde la BD)
const checkOwnershipOrAdmin = (getOwnerIDFromParams) => {
  return async (req, res, next) => {
    try {
      const userID = req.user.id;
      const roles = req.user.roles;

      const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

      // Si es admin, permitir sin validar propiedad
      if (isAdmin) return next();

      // Consultar el dueño del recurso
      const resourceOwnerID = await getOwnerIDFromParams(req);

      if (!resourceOwnerID) {
        return res.status(404).json({ message: 'Recurso no encontrado o sin dueño asociado.' });
      }

      // Validar si el usuario logueado es el dueño
      if (userID === resourceOwnerID) {
        return next();
      }

      return res.status(403).json({ message: 'No tienes permiso para acceder a este recurso.' });
    } catch (error) {
      console.error('Error en checkOwnershipOrAdmin:', error.message);
      res.status(500).json({ message: 'Error al validar propiedad del recurso' });
    }
  };
};

module.exports = checkOwnershipOrAdmin;
