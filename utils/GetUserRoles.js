const pool  = require('../config/db');

const getUserRoles = async (userID) => {
  const [rows] = await pool.query(`
    SELECT r.roleName
    FROM UserRole ur
    JOIN Role r ON ur.roleID = r.roleID
    WHERE ur.userID = ?
  `, [userID]);

  return rows.map(r => r.roleName);
};

module.exports = getUserRoles;
