const UserRole = require('../models/UserRole');
const pool = require('../config/db');

/// Obtener todos los roles de un usuario específico (por ID explícito)
exports.getUserRoles = async (req, res) => {
  try {
    const userID = req.params.userID;
    const roles = await UserRole.getRolesByUserID(userID);
    res.status(200).json({ roles });
  } catch (error) {
    console.error('Error al obtener roles:', error.message);
    res.status(500).json({ error: 'Error al obtener roles del usuario' });
  }
};

/// Obtener los roles del usuario autenticado usando el token
exports.getMyRoles = async (req, res) => {
  try {
    const userID = req.user.id; // viene del token verificado en authMiddleware
    const roles = await UserRole.getRolesByUserID(userID);
    res.status(200).json({ roles });
  } catch (error) {
    console.error('Error al obtener roles del usuario autenticado:', error.message);
    res.status(500).json({ error: 'Error al obtener roles del usuario autenticado' });
  }
};

/// Asignar nuevos roles a un usuario, reemplazando los anteriores
exports.assignRoles = async (req, res) => {
  try {
    const { userID, roleIDs } = req.body;

    // Validación de estructura del body
    if (!userID || !Array.isArray(roleIDs) || roleIDs.length === 0) {
      return res.status(400).json({ error: 'userID y roleIDs son requeridos y válidos' });
    }

    // Validar que todos los roleIDs existan en la tabla Role
    const [existingRoles] = await pool.query(
      `SELECT roleID FROM Role WHERE roleID IN (?)`, [roleIDs]
    );
    const validRoleIDs = existingRoles.map(r => r.roleID);

    // Detectar roleIDs inválidos
    const invalidRoles = roleIDs.filter(id => !validRoleIDs.includes(id));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ error: `Los siguientes roleIDs no existen: ${invalidRoles.join(', ')}` });
    }

    // Reemplazar los roles actuales por los nuevos
    await UserRole.deleteRolesFromUser(userID);
    await UserRole.assignRolesToUser(userID, validRoleIDs);

    res.status(201).json({ message: 'Roles asignados correctamente' });
  } catch (error) {
    console.error('Error al asignar roles:', error.message);
    res.status(500).json({ error: 'Error al asignar roles al usuario' });
  }
};
