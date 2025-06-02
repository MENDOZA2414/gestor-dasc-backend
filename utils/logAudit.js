const pool = require('../config/db');

/**
 * Registra un evento en la tabla Audit
 * @param {Object} data
 * @param {string} data.table - Nombre de la tabla afectada, ejemplo: 'StudentDocumentation'
 * @param {string} data.action - Acción realizada, ejemplo: 'Envio', 'Aprobacion', 'Rechazo'
 * @param {number} data.userID - ID del usuario que realiza la acción
 * @param {string} data.userType - Tipo de usuario (admin, student, internalAssessor, etc.)
 * @param {string} data.details - Descripción textual del evento
 * @param {number} [data.documentID] - (Opcional) ID del documento afectado
 * @param {number} [data.studentID] - (Opcional) ID del estudiante afectado
 */
const logAudit = async ({ tableName, action, userID, userType, details, documentID = null, studentID = null }) => {
  const query = `
    INSERT INTO Audit (tableName, action, userID, userType, details, documentID, studentID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.query(query, [tableName, action, userID, userType, details, documentID, studentID]);
};

module.exports = logAudit;