const pool = require('../config/db');

const progressSteps = [
  { step: 1, type: 'CartaPresentacion' },
  { step: 2, type: 'CartaAceptacion' },
  { step: 3, type: 'CartaIMSS' },
  { step: 4, type: 'CartaCompromiso' },
  { step: 5, type: 'Reporte I' },
  { step: 6, type: 'Reporte II' },
  { step: 7, type: 'Reporte Final' },
  { step: 8, type: 'CuestionarioSatisfaccion' },
  { step: 9, type: 'CartaTerminacion' },
  { step: 10, type: 'InformeFinal' }
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
