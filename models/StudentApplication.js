const pool = require('../config/db');
const uploadToFTP = require('../utils/FtpUploader');

// Obtener todas las postulaciones por ID de vacante (activas)
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
        P.positionName AS positionTitle
      FROM StudentApplication A
      INNER JOIN PracticePosition P ON A.practicePositionID = P.practicePositionID
      WHERE A.practicePositionID = ? AND A.recordStatus = 'Activo'
    `;
    const [results] = await pool.query(query, [positionID]);
    return results;
};

// Obtener la ruta y nombre de la carta de presentación por ID de postulación
const getCoverLetterByID = async (applicationID) => {
  const query = `
    SELECT 
      SA.coverLetterFileName, 
      SA.coverLetterFilePath, 
      SA.studentID, 
      P.companyID
    FROM StudentApplication SA
    JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
    WHERE SA.applicationID = ? AND SA.recordStatus = 'Activo'
  `;
  const [results] = await pool.query(query, [applicationID]);
  return results.length > 0 ? results[0] : null;
};

// Obtener todas las postulaciones realizadas por un estudiante
const getApplicationsByStudentID = async (studentID) => {
  const query = `
    SELECT 
      A.applicationID,
      A.practicePositionID,
      A.status,
      A.coverLetterFileName,
      A.coverLetterFilePath,
      A.timestamp,
      P.positionName AS positionTitle,
      C.companyName
    FROM StudentApplication A
    INNER JOIN PracticePosition P ON A.practicePositionID = P.practicePositionID
    INNER JOIN Company C ON P.companyID = C.companyID
    WHERE A.studentID = ? AND A.recordStatus = 'Activo'
  `;
  const [results] = await pool.query(query, [studentID]);
  return results;
};

// Registrar una nueva postulación con archivo en FTP
const saveApplication = async ({ studentID, practicePositionID, coverLetterFileName, coverLetterFilePath }) => {
  const alreadyApplied = await verifyStudentApplication(studentID, practicePositionID);
  if (alreadyApplied) {
    throw new Error("Ya existe una postulación activa para esta vacante");
  }

  const insertQuery = `
    INSERT INTO StudentApplication 
    (studentID, practicePositionID, status, coverLetterFileName, coverLetterFilePath, timestamp, recordStatus)
    VALUES (?, ?, 'Pendiente', ?, ?, NOW(), 'Activo')
  `;
  await pool.query(insertQuery, [
    studentID,
    practicePositionID,
    coverLetterFileName,
    coverLetterFilePath
  ]);
};

// Actualizar una postulación existente
const patchApplication = async (applicationID, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error("No se proporcionaron campos para actualizar");
  }

  const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente', 'Preaceptado'];

  if (updateData.status && !validStatuses.includes(updateData.status)) {
    throw new Error("Estatus de postulación no válido");
  }

  if (updateData.coverLetterFileName === "") updateData.coverLetterFileName = null;
  if (updateData.coverLetterFilePath === "") updateData.coverLetterFilePath = null;

  // Verificar que exista la postulación antes de actualizar
  const [[existing]] = await pool.query(
    'SELECT applicationID FROM StudentApplication WHERE applicationID = ? AND recordStatus = "Activo"',
    [applicationID]
  );

  if (!existing) {
    throw new Error("La postulación no existe o fue eliminada");
  }

  const keys = Object.keys(updateData);
  const values = [];

  const setClause = keys.map(key => {
    values.push(updateData[key]);
    return `${key} = ?`;
  }).join(", ");

  const query = `
    UPDATE StudentApplication
    SET ${setClause}
    WHERE applicationID = ? AND recordStatus = 'Activo'
  `;

  values.push(applicationID);
  const [result] = await pool.query(query, values);

  return { message: "Postulación actualizada correctamente" };
};

// Obtener todas las postulaciones recibidas por una empresa (entidad)
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
    WHERE P.companyID = ? AND A.recordStatus = 'Activo'
    ORDER BY A.timestamp DESC
  `;
  const [results] = await pool.query(query, [companyID]);
  return results;
};

// Obtener datos completos de una postulación por ID
const getFullApplicationData = async (applicationID, connection = pool) => {
  const [rows] = await connection.query(`
    SELECT 
      SA.applicationID,
      SA.studentID,
      SA.practicePositionID,
      SA.coverLetterFileName,
      SA.coverLetterFilePath,
      SA.statusHistory,
      S.controlNumber,
      P.companyID,
      P.currentStudents,
      P.maxStudents,
      P.positionName,
      P.startDate,
      P.endDate,
      P.externalAssessorID
    FROM StudentApplication SA
    JOIN Student S ON SA.studentID = S.studentID
    JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
    WHERE SA.applicationID = ? AND SA.recordStatus = 'Activo'
  `, [applicationID]);

  return rows.length > 0 ? rows[0] : null;
}; 

// Verificar si ya existe una postulación activa para una vacante (excluyendo rechazadas)
const verifyStudentApplication = async (studentID, practicePositionID) => {
  const [rows] = await pool.query(`
    SELECT applicationID 
    FROM StudentApplication 
    WHERE studentID = ? 
      AND practicePositionID = ?
      AND status != 'Rechazado'
      AND recordStatus = 'Activo'
  `, [studentID, practicePositionID]);

  return rows.length > 0;
};

module.exports = {
    getApplicationsByPositionID,
    getCoverLetterByID,
    getApplicationsByStudentID,
    saveApplication,
    patchApplication,
    getApplicationsByCompanyID,
    getFullApplicationData,
    verifyStudentApplication
};