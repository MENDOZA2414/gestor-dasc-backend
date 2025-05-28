const pool = require('../config/db');

const getInternalAssessorOwnerID = async (req) => {
  const [rows] = await pool.query(
    'SELECT userID FROM InternalAssessor WHERE internalAssessorID = ?',
    [parseInt(req.params.id)]
  );
  return rows[0]?.userID || null;
};
const getUserOwnerID = async (req) => {
  return parseInt(req.params.userID); 
};

module.exports = {
  getInternalAssessorOwnerID,
  getUserOwnerID
};
