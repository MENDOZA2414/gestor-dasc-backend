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
      SELECT coverLetterFileName, coverLetterFilePath
      FROM StudentApplication
      WHERE applicationID = ? AND recordStatus = 'Activo'
    `;
    const [results] = await pool.query(query, [applicationID]);
    return results.length > 0 ? results[0] : null;
};

// Verificar si un estudiante ya se ha postulado a una vacante específica
const verifyStudentApplication = async (studentID, positionID) => {
    const query = `
      SELECT COUNT(*) as count
      FROM StudentApplication
      WHERE studentID = ? AND practicePositionID = ? AND recordStatus = 'Activo'
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
      WHERE studentID = ? AND recordStatus = 'Activo'
    `;
    const [results] = await pool.query(query, [studentID]);
    return results;
};

// Eliminar lógicamente una postulación por ID
const rejectApplication = async (applicationID) => {
    const query = `
      UPDATE StudentApplication
      SET recordStatus = 'Eliminado'
      WHERE applicationID = ? AND recordStatus = 'Activo'
    `;
    const [result] = await pool.query(query, [applicationID]);
    return result.affectedRows > 0;
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

  const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente'];

  if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new Error("Estatus de postulación no válido");
  }

  if (updateData.coverLetterFileName === "") updateData.coverLetterFileName = null;
  if (updateData.coverLetterFilePath === "") updateData.coverLetterFilePath = null;

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

  if (result.affectedRows === 0) {
      throw new Error("No se pudo actualizar la postulación o ya fue eliminada");
  }

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

module.exports = {
    getApplicationsByPositionID,
    getCoverLetterByID,
    verifyStudentApplication,
    getApplicationsByStudentID,
    rejectApplication,
    saveApplication,
    patchApplication,
    getApplicationsByCompanyID
};
