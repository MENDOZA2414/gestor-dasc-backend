const pool = require('../config/db');

// Creación de práctica profesional
const createPractice = async ({
  studentID,
  companyID,
  externalAssessorID,
  positionTitle,
  startDate,
  endDate
}) => {
  const insertQuery = `
    INSERT INTO ProfessionalPractice (
      studentID, companyID, externalAssessorID, positionTitle,
      startDate, endDate, status, creationDate, recordStatus
    ) VALUES (?, ?, ?, ?, ?, ?, 'Started', NOW(), 'Activo')
  `;

  await pool.query(insertQuery, [
    studentID,
    companyID,
    externalAssessorID,
    positionTitle,
    startDate,
    endDate
  ]);

  return { message: 'Práctica profesional creada correctamente' };
};

// Obtener la práctica profesional registrada de un estudiante
const getPracticeByStudentID = async (studentID) => {
  const query = `
    SELECT 
      PP.practiceID,
      PP.studentID,
      PP.companyID,
      C.companyName AS companyName,
      PP.externalAssessorID,
      EA.firstName AS assessorFirstName,
      EA.firstLastName AS assessorLastName,
      PP.startDate,
      PP.endDate,
      PP.status,
      PP.positionTitle,
      PP.creationDate
    FROM ProfessionalPractice PP
    JOIN Company C ON PP.companyID = C.companyID
    LEFT JOIN ExternalAssessor EA ON PP.externalAssessorID = EA.externalAssessorID
    WHERE PP.studentID = ? AND PP.recordStatus = 'Activo'
  `;
  const [results] = await pool.query(query, [studentID]);
  return results.length > 0 ? results[0] : null;
};

// Obtener todas las prácticas registradas por una empresa
const getPracticesByCompanyID = async (companyID) => {
    const query = `
      SELECT 
        PP.practiceID,
        PP.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status,
        PP.creationDate,
        EA.firstName AS assessorFirstName,
        EA.firstLastName AS assessorLastName
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      LEFT JOIN ExternalAssessor EA ON PP.externalAssessorID = EA.externalAssessorID
      WHERE PP.companyID = ? AND PP.recordStatus = 'Activo'
      ORDER BY PP.creationDate DESC
    `;
    const [results] = await pool.query(query, [companyID]);
    return results;
};

// Obtener todas las prácticas asignadas a un asesor externo
const getPracticesByExternalAssessorID = async (externalAssessorID) => {
    const query = `
      SELECT 
        PP.practiceID,
        PP.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status,
        PP.creationDate,
        C.companyName AS companyName
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      JOIN Company C ON PP.companyID = C.companyID
      WHERE PP.externalAssessorID = ? AND PP.recordStatus = 'Activo'
      ORDER BY PP.creationDate DESC
    `;
    const [results] = await pool.query(query, [externalAssessorID]);
    return results;
};

// Obtener todas las prácticas de los alumnos asignados a un asesor interno
const getPracticesByInternalAssessorID = async (internalAssessorID) => {
    const query = `
      SELECT 
        PP.practiceID,
        PP.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status,
        PP.creationDate,
        C.companyName AS companyName,
        EA.firstName AS assessorFirstName,
        EA.firstLastName AS assessorLastName
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      JOIN Company C ON PP.companyID = C.companyID
      LEFT JOIN ExternalAssessor EA ON PP.externalAssessorID = EA.externalAssessorID
      WHERE S.internalAssessorID = ? AND PP.recordStatus = 'Activo'
      ORDER BY PP.creationDate DESC
    `;
    const [results] = await pool.query(query, [internalAssessorID]);
    return results;
};

// Obtener la práctica de un alumno asignado a un asesor interno específico
const getStudentPracticeByAssessor = async (internalAssessorID, studentID) => {
    const query = `
      SELECT 
        PP.practiceID,
        PP.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status,
        PP.creationDate,
        C.companyName AS companyName,
        EA.firstName AS assessorFirstName,
        EA.firstLastName AS assessorLastName
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      JOIN Company C ON PP.companyID = C.companyID
      LEFT JOIN ExternalAssessor EA ON PP.externalAssessorID = EA.externalAssessorID
      WHERE S.internalAssessorID = ? AND S.studentID = ? AND PP.recordStatus = 'Activo'
    `;
    const [results] = await pool.query(query, [internalAssessorID, studentID]);
    return results.length > 0 ? results[0] : null;
};

// Obtener todas las prácticas con opción de filtrar por carrera o estado 
const getAllPractices = async (career = null, status = null) => {
    let query = `
      SELECT 
        PP.practiceID,
        PP.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        S.career,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status,
        PP.creationDate,
        C.companyName AS companyName,
        EA.firstName AS assessorFirstName,
        EA.firstLastName AS assessorLastName
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      JOIN Company C ON PP.companyID = C.companyID
      LEFT JOIN ExternalAssessor EA ON PP.externalAssessorID = EA.externalAssessorID
      WHERE PP.recordStatus = 'Activo'
    `;

    const params = [];

    if (career) {
      query += ` AND S.career = ?`;
      params.push(career);
    }

    if (status) {
      query += ` AND PP.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY PP.creationDate DESC`;

    const [results] = await pool.query(query, params);
    return results;
};

// Obtener estudiantes asignados a un asesor externo
const getStudentsByExternalAssessorID = async (externalAssessorID) => {
    const query = `
      SELECT 
        S.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        S.career,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      WHERE PP.externalAssessorID = ? AND PP.recordStatus = 'Activo'
      ORDER BY S.firstLastName, S.secondLastName
    `;
    const [results] = await pool.query(query, [externalAssessorID]);
    return results;
};

// Obtener estudiantes que están realizando prácticas en una institución específica
const getStudentsByCompanyID = async (companyID) => {
    const query = `
      SELECT 
        S.studentID,
        S.controlNumber,
        S.firstName,
        S.firstLastName,
        S.secondLastName,
        S.career,
        PP.positionTitle,
        PP.startDate,
        PP.endDate,
        PP.status
      FROM ProfessionalPractice PP
      JOIN Student S ON PP.studentID = S.studentID
      WHERE PP.companyID = ? AND PP.recordStatus = 'Activo'
      ORDER BY S.firstLastName, S.secondLastName
    `;
    const [results] = await pool.query(query, [companyID]);
    return results;
};

// Editar una práctica profesional existente
const patchPractice = async (practiceID, updateData) => {
  const fields = [];
  const values = [];

  if (updateData.startDate) {
    fields.push("startDate = ?");
    values.push(updateData.startDate);
  }
  if (updateData.endDate) {
    fields.push("endDate = ?");
    values.push(updateData.endDate);
  }
  if (updateData.status) {
    fields.push("status = ?");
    values.push(updateData.status);
  }
  if (updateData.positionTitle) {
    fields.push("positionTitle = ?");
    values.push(updateData.positionTitle);
  }

  if (fields.length === 0) {
    throw new Error("No se proporcionaron campos válidos para actualizar");
  }

  const query = `
    UPDATE ProfessionalPractice
    SET ${fields.join(", ")}
    WHERE practiceID = ? AND recordStatus = 'Activo'
  `;

  values.push(practiceID);

  const [result] = await pool.query(query, values);

  if (result.affectedRows === 0) {
    throw new Error('No se pudo actualizar la práctica profesional');
  }

  return { message: 'Práctica profesional actualizada correctamente' };
};

// Eliminar lógicamente una práctica profesional
const deletePractice = async (practiceID) => {
  const query = `UPDATE ProfessionalPractice SET recordStatus = 'Eliminado' WHERE practiceID = ?`;
  const [result] = await pool.query(query, [practiceID]);

  if (result.affectedRows === 0) {
    throw new Error('No se encontró la práctica para eliminar');
  }

  return { message: 'Práctica profesional eliminada correctamente' };
};

module.exports = {
    createPractice,
    getPracticeByStudentID,
    getPracticesByCompanyID,
    getPracticesByExternalAssessorID,
    getPracticesByInternalAssessorID,
    getStudentPracticeByAssessor,
    getAllPractices,
    getStudentsByExternalAssessorID,
    getStudentsByCompanyID,
    patchPractice,
    deletePractice
};
