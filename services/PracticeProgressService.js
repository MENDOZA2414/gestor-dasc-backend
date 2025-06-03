const pool = require('../config/db');

// Documentos requeridos para calcular progreso
const PRACTICE_DOCUMENTS = [
  'Reporte I',
  'Reporte II',
  'Reporte Final',          
  'CuestionarioSatisfaccion',
  'CartaTerminacion',
  'InformeFinal'
];

const DOCUMENT_STEP_VALUES = {
  'Reporte I': 15,
  'Reporte II': 15,
  'Reporte Final': 20,
  'CuestionarioSatisfaccion': 15,
  'CartaTerminacion': 15,
  'InformeFinal': 20
};
// Normalizador de texto (sin espacios, lowercase)
const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, '');

// Convertimos las listas a versiones normalizadas
const normalizedPracticeDocs = PRACTICE_DOCUMENTS.map(normalize);
const normalizedStepValues = {};
for (const [key, value] of Object.entries(DOCUMENT_STEP_VALUES)) {
  normalizedStepValues[normalize(key)] = value;
}

const calculatePracticeProgress = async (studentID) => {
  console.log("studentID recibido:", studentID);

  const [docs] = await pool.query(`
    SELECT documentType FROM StudentDocumentation
    WHERE studentID = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
  `, [studentID]);

  const approvedDocs = docs.map(d => d.documentType);
  const normalizedApproved = approvedDocs.map(normalize);

  const approvedPracticeDocs = approvedDocs.filter(
    (doc, idx) => normalizedPracticeDocs.includes(normalizedApproved[idx])
  );

  // Calcular porcentaje
  let practicePercentage = 0;
  for (const normDoc of normalizedApproved) {
    if (normalizedStepValues[normDoc]) {
      practicePercentage += normalizedStepValues[normDoc];
    }
  }

  // Verificar si la práctica ya inició (step >= 5)
  const [[practice]] = await pool.query(`
    SELECT progressStep, status FROM ProfessionalPractice
    WHERE studentID = ? AND recordStatus = 'Activo'
    LIMIT 1
  `, [studentID]);

  const practiceStarted = practice && practice.progressStep >= 5;

  // Cambiar a Finished si ya completó todos los documentos
  if (practicePercentage === 100 && practice?.status === 'Started') {
    await pool.query(`
      UPDATE ProfessionalPractice
      SET status = 'Finished'
      WHERE studentID = ? AND recordStatus = 'Activo'
    `, [studentID]);
  }

  // Verificar si puede iniciar práctica
  const hasCartaPresentacion = normalizedApproved.includes(normalize('CartaPresentacion'));
  const hasCartaAceptacion = normalizedApproved.includes(normalize('CartaAceptacion'));
  const hasCartaCompromiso = normalizedApproved.includes(normalize('CartaCompromiso'));
  const hasCartaIMSS = normalizedApproved.includes(normalize('CartaIMSS'));

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
