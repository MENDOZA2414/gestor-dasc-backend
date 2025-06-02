const pool = require('../config/db');

const updateProgressStep = async (studentID, newStep) => {
  if (![0, 1, 2, 3, 4].includes(newStep)) {
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
