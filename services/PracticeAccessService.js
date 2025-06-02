const pool = require('../config/db');

// Verifica si un usuario (asesor interno o empresa) tiene acceso a la práctica de un alumno
const hasAccessToPractice = async (studentID, requester) => {
  const { userTypeName, id: requesterID, roles } = requester;

  // Si es Admin o SuperAdmin, siempre tiene acceso
  if (roles.includes('Admin') || roles.includes('SuperAdmin')) {
    return true;
  }

  // Consulta la práctica profesional activa de ese alumno
  const [rows] = await pool.query(`
    SELECT internalAssessorID, companyID
    FROM ProfessionalPractice
    WHERE studentID = ? AND recordStatus = 'Activo'
  `, [studentID]);

  if (rows.length === 0) return false;

  const { internalAssessorID, companyID } = rows[0];

  if (userTypeName === 'internalAssessor' && internalAssessorID === requesterID) {
    return true;
  }

  if (userTypeName === 'company') {
    // Obtener su companyID real desde la tabla Company
    const [[company]] = await pool.query(
      'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
      [requesterID]
    );
    if (!company) return false;

    return company.companyID === companyID;
  }

  return false;
};

module.exports = {
  hasAccessToPractice
};
