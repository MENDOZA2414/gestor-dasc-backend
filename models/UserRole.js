const pool = require('../config/db');

/// Obtener todos los roles que tiene un usuario (incluye ID y nombre del rol)
const getRolesByUserID = async (userID) => {
    const query = `
        SELECT r.roleID, r.roleName
        FROM UserRole ur
        JOIN Role r ON ur.roleID = r.roleID
        WHERE ur.userID = ?
    `;
    const [rows] = await pool.query(query, [userID]);
    return rows;
};

/// Asignar múltiples roles a un usuario (sobrescribe los actuales)
const assignRolesToUser = async (userID, roleIDs) => {
    if (!Array.isArray(roleIDs) || roleIDs.length === 0) {
        throw new Error('Se requiere una lista válida de roleIDs');
    }

    const values = roleIDs.map(roleID => [userID, roleID]);
    const query = `INSERT INTO UserRole (userID, roleID) VALUES ?`;
    await pool.query(query, [values]);
};

/// Eliminar todos los roles asignados actualmente a un usuario
const deleteRolesFromUser = async (userID) => {
    const query = `DELETE FROM UserRole WHERE userID = ?`;
    await pool.query(query, [userID]);
};

/// Obtener solo los roleIDs válidos desde la tabla Role (para validación)
const getValidRoleIDs = async (roleIDs) => {
    const [rows] = await pool.query(`SELECT roleID FROM Role WHERE roleID IN (?)`, [roleIDs]);
    return rows.map(r => r.roleID);
};

module.exports = {
    getRolesByUserID,
    assignRolesToUser,
    deleteRolesFromUser,
    getValidRoleIDs
};
