const pool = require('../config/db');

// Obtener todas las postulaciones por ID de vacante
const getApplicationsByPositionID = async (positionID) => {
    const query = `
      SELECT 
        A.applicationID,
        A.studentID,
        A.practicePositionID,
        A.status,
        A.coverLetterFileName,
        A.coverLetterFilePath,
        A.timestamp,
        P.title AS positionTitle
      FROM StudentApplication A
      INNER JOIN PracticePosition P ON A.practicePositionID = P.practicePositionID
      WHERE A.practicePositionID = ?
    `;
    const [results] = await pool.query(query, [positionID]);
    return results;
};
 
// Obtener la ruta y nombre de la carta de presentación por ID de postulación
const getCoverLetterByID = async (applicationID) => {
    const query = `
      SELECT coverLetterFileName, coverLetterFilePath
      FROM StudentApplication
      WHERE applicationID = ?
    `;
    const [results] = await pool.query(query, [applicationID]);
    return results.length > 0 ? results[0] : null;
};

// Verificar si un estudiante ya se ha postulado a una vacante específica
const verifyStudentApplication = async (studentID, positionID) => {
    const query = `
      SELECT COUNT(*) as count
      FROM StudentApplication
      WHERE studentID = ? AND practicePositionID = ?
    `;
    const [results] = await pool.query(query, [studentID, positionID]);
    return results[0].count > 0;
};

// Obtener todas las postulaciones realizadas por un estudiante
const getApplicationsByStudentID = async (studentID) => {
    const query = `
      SELECT 
        applicationID,
        practicePositionID,
        status,
        coverLetterFileName,
        coverLetterFilePath,
        timestamp
      FROM StudentApplication
      WHERE studentID = ?
    `;
    const [results] = await pool.query(query, [studentID]);
    return results;
};

// Rechazar (eliminar) una postulación por ID
const rejectApplication = async (applicationID) => {
    const query = `
      DELETE FROM StudentApplication
      WHERE applicationID = ?
    `;
    const [result] = await pool.query(query, [applicationID]);
    return result.affectedRows > 0;
};

// Aceptar una postulación:
const acceptApplication = async (applicationID) => {
  const queryApplication = `
    SELECT 
      A.studentID, A.practicePositionID,
      P.companyID, P.externalAssessorID, P.positionName AS positionTitle,
      P.startDate, P.endDate,
      P.maxStudents, P.currentStudents
    FROM 
      StudentApplication A
    JOIN 
      PracticePosition P ON A.practicePositionID = P.practicePositionID
    WHERE 
      A.applicationID = ?
  `;

  const queryCheckPractice = `SELECT * FROM ProfessionalPractice WHERE studentID = ?`;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultApplication] = await connection.query(queryApplication, [applicationID]);
    if (resultApplication.length === 0) throw new Error('No se encontró la postulación');

    const application = resultApplication[0];

    // Validar que la vacante aún tenga espacio
    if (application.currentStudents >= application.maxStudents) {
      throw new Error('La vacante ya alcanzó el número máximo de estudiantes permitidos');
    }

    // Validar que el estudiante no tenga ya una práctica registrada
    const [resultPractice] = await connection.query(queryCheckPractice, [application.studentID]);
    if (resultPractice.length > 0) {
      throw new Error('El estudiante ya tiene una práctica profesional registrada');
    }

    const startDate = new Date(application.startDate).toISOString().split('T')[0];
    const endDate = new Date(application.endDate).toISOString().split('T')[0];

    // Registrar práctica profesional en tabla ProfessionalPractice
    const queryInsertPractice = `
      INSERT INTO ProfessionalPractice 
      (studentID, companyID, externalAssessorID, startDate, endDate, status, positionTitle, creationDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      application.studentID,
      application.companyID,
      application.externalAssessorID,
      startDate,
      endDate,
      'Started',
      application.positionTitle
    ];
    await connection.query(queryInsertPractice, values);

    // Eliminar solo la postulación aceptada
    const queryDeleteApplication = `DELETE FROM StudentApplication WHERE applicationID = ?`;
    await connection.query(queryDeleteApplication, [applicationID]);

    // Actualizar contador de estudiantes aceptados
    const queryUpdateCupo = `
      UPDATE PracticePosition
      SET currentStudents = currentStudents + 1
      WHERE practicePositionID = ?
    `;
    await connection.query(queryUpdateCupo, [application.practicePositionID]);

    await connection.commit();
    return { message: 'Práctica registrada exitosamente. Vacante actualizada.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Registrar una nueva postulación con archivo en FTP
const saveApplication = async ({ studentID, practicePositionID, coverLetterFileName, coverLetterFilePath }) => {
    const query = `
      INSERT INTO StudentApplication 
      (studentID, practicePositionID, coverLetterFileName, coverLetterFilePath, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await pool.query(query, [studentID, practicePositionID, coverLetterFileName, coverLetterFilePath]);
};

// Obtener todas las postulaciones recibidas por una entidad (empresa)
const getApplicationsByCompanyID = async (companyID) => {
  const query = `
    SELECT 
      A.applicationID,
      A.studentID,
      S.controlNumber,
      S.firstName,
      S.firstLastName,
      S.secondLastName,
      S.career,
      S.semester,
      S.shift,
      P.practicePositionID,
      P.positionName AS positionTitle,
      A.status,
      A.coverLetterFileName,
      A.coverLetterFilePath,
      A.timestamp
    FROM StudentApplication A
    JOIN PracticePosition P ON A.practicePositionID = P.practicePositionID
    JOIN Student S ON A.studentID = S.studentID
    WHERE P.companyID = ?
    ORDER BY A.timestamp DESC
  `;
  const [results] = await pool.query(query, [companyID]);
  return results;
};

  
  
module.exports = {
    getApplicationsByPositionID,
    getCoverLetterByID,
    verifyStudentApplication,
    getApplicationsByStudentID,
    rejectApplication,
    acceptApplication,
    saveApplication,
    getApplicationsByCompanyID
};
