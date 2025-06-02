const pool = require('../config/db');

const PRACTICE_DOCUMENTS = [
  'Reporte I',
  'Reporte II',
  'CuestionarioSatisfaccion',
  'CartaTerminacion',
  'InformeFinal'
];

const DOCUMENT_STEP_VALUES = {
  'Reporte I': 20,
  'Reporte II': 20,
  'CuestionarioSatisfaccion': 20,
  'CartaTerminacion': 20,
  'InformeFinal': 20
};

const calculatePracticeProgress = async (studentID) => {
  // Verificar documentos aprobados
  const [docs] = await pool.query(`
    SELECT documentType FROM StudentDocumentation
    WHERE studentID = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
  `, [studentID]);

  const approvedDocs = docs.map(d => d.documentType);

  // Filtrar solo los documentos de la práctica profesional
  const approvedPracticeDocs = approvedDocs.filter(doc => PRACTICE_DOCUMENTS.includes(doc));

  // Calcular porcentaje
  let practicePercentage = 0;
  for (const doc of approvedPracticeDocs) {
    practicePercentage += DOCUMENT_STEP_VALUES[doc] || 0;
  }

  // Consultar paso actual de la práctica
  const [[practice]] = await pool.query(`
    SELECT progressStep FROM ProfessionalPractice
    WHERE studentID = ? AND recordStatus = 'Activo'
    LIMIT 1
  `, [studentID]);

  const practiceStarted = practice && practice.progressStep >= 5;

  // Verificar si tiene los requisitos previos (puede iniciar)
  const hasCartaPresentacion = approvedDocs.includes('CartaPresentacion');
  const hasCartaAceptacion = approvedDocs.includes('CartaAceptacion');
  const hasCartaCompromiso = approvedDocs.includes('CartaCompromiso');
  const hasCartaIMSS = approvedDocs.includes('CartaIMSS');

  const [[app]] = await pool.query(`
    SELECT status FROM StudentApplication
    WHERE studentID = ? AND status = 'Preaceptado' AND recordStatus = 'Activo'
    LIMIT 1
  `, [studentID]);

  const hasPreaceptedApplication = !!app;

  const canStartPractice =
    hasCartaPresentacion &&
    hasCartaAceptacion &&
    hasCartaCompromiso &&
    hasCartaIMSS &&
    hasPreaceptedApplication;

  return {
    practiceStarted,
    practicePercentage,
    approvedPracticeDocs,
    canStartPractice
  };
};

module.exports = {
  calculatePracticeProgress
};
