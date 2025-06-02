const pool = require('../config/db');

const updateProgressStep = async (studentID, newStep) => {
  if (newStep < 0 || newStep > 10) {
    throw new Error('Paso de progreso inválido');
  }

  await pool.query(`
    UPDATE ProfessionalPractice
    SET progressStep = ?
    WHERE studentID = ? AND recordStatus = 'Activo'
  `, [newStep, studentID]);
};

module.exports = {
  updateProgressStep
};
