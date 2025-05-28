const pool = require('../config/db');

const isTargetAdminUser = async (userID) => {
  const [target] = await pool.query(`
    SELECT ut.userTypeName
    FROM User u
    JOIN UserType ut ON u.userTypeID = ut.userTypeID
    WHERE u.userID = ?
  `, [userID]);

  return target[0]?.userTypeName === 'adminOnly' || target[0]?.userTypeName === 'SuperAdmin';
};

module.exports = {
  isTargetAdminUser
};
