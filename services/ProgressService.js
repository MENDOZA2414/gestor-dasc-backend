const pool = require('../config/db');

const progressSteps = [
  { step: 1, type: 'CartaPresentacion' },
  { step: 2, type: 'CartaAceptacion' },
  { step: 3, type: 'CartaIMSS' },
  { step: 4, type: 'ReporteI' },
  { step: 5, type: 'ReporteII' },
  { step: 6, type: 'ReporteFinal' },
  { step: 7, type: 'CartaLiberacion' }
];

// Devuelve el tipo de documento que le toca subir al alumno
const getNextRequiredDocument = async (studentID) => {
  const [rows] = await pool.query(
    'SELECT documentType, status FROM StudentDocumentation WHERE studentID = ?',
    [studentID]
  );

  const acceptedDocs = rows
    .filter(d => d.status === 'Aceptado')
    .map(d => d.documentType);

  for (const step of progressSteps) {
    if (!acceptedDocs.includes(step.type)) {
      return step.type;
    }
  }

  return null; // Ya completó todos los pasos
};

module.exports = {
  getNextRequiredDocument
};
