const pool = require('../config/db');

// Creación de vacante
const createPosition = async (positionData) => {
  const {
    positionName, startDate, endDate, city,
    positionType, description, companyID, externalAssessorID,
    maxStudents, status = 'Pendiente'
  } = positionData;

  const insertQuery = `
    INSERT INTO PracticePosition (
      positionName, startDate, endDate, city, positionType,
      description, companyID, externalAssessorID,
      status, maxStudents, currentStudents, recordStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(insertQuery, [
    positionName, startDate, endDate, city, positionType,
    description, companyID, externalAssessorID,
    status, maxStudents, 0, 'Activo'
  ]);

  const [rows] = await pool.query(`SELECT * FROM PracticePosition WHERE practicePositionID = ?`, [result.insertId]);
  return rows[0];
};

// Obtener vacante por ID
const getPositionByID = async (practicePositionID) => {
    const query = 'SELECT * FROM PracticePosition WHERE practicePositionID = ? AND recordStatus = "Activo"';
    const [result] = await pool.query(query, [practicePositionID]);
    if (result.length > 0) {
        return result[0];
    } else {
        throw new Error('No existe la vacante');
    }
};

// Obtener vacantes por ID de empresa
const getPositionsByCompanyID = async (companyID) => {
    const query = `
        SELECT pp.*, 
               ea.firstName AS externalAssessorName, 
               ea.firstLastName AS externalAssessorLastName, 
               ea.secondLastName AS externalAssessorSecondLastName, 
               er.companyName AS companyName, 
               er.photo AS companyLogo 
        FROM PracticePosition pp
        JOIN ExternalAssessor ea ON pp.externalAssessorID = ea.externalAssessorID
        JOIN Company er ON pp.companyID = er.companyID
        WHERE pp.companyID = ? AND pp.recordStatus = 'Activo'
        ORDER BY pp.practicePositionID DESC
    `;
    const [results] = await pool.query(query, [companyID]);
    return results;
};

// Obtener todas las vacantes con paginación
const getAllPositions = async (page, limit) => {
    const start = (page - 1) * limit;
    const query = `
        SELECT pp.*, 
               ea.firstName AS externalAssessorName, 
               ea.firstLastName AS externalAssessorLastName, 
               ea.secondLastName AS externalAssessorSecondLastName, 
               er.companyName AS companyName, 
               er.photo AS companyLogo 
        FROM PracticePosition pp
        JOIN ExternalAssessor ea ON pp.externalAssessorID = ea.externalAssessorID
        JOIN Company er ON pp.companyID = er.companyID
        WHERE pp.recordStatus = 'Activo'
        ORDER BY pp.practicePositionID DESC 
        LIMIT ?, ?
    `;
    const [results] = await pool.query(query, [start, limit]);
    return results;
};

// Obtener vacantes por estatus
const getPositionsByStatus = async (status) => {
    let query = `
      SELECT pp.*, 
             ea.firstName AS externalAssessorName, 
             ea.firstLastName AS externalAssessorLastName, 
             ea.secondLastName AS externalAssessorSecondLastName, 
             er.companyName AS companyName, 
             er.photo AS companyLogo 
      FROM PracticePosition pp
      JOIN ExternalAssessor ea ON pp.externalAssessorID = ea.externalAssessorID
      JOIN Company er ON pp.companyID = er.companyID
      WHERE pp.recordStatus = 'Activo'
    `;
    const params = [];
    const validStatuses = ['Pendiente', 'Aceptado', 'Rechazado', 'Inactiva', 'Cerrado'];

    if (status && validStatuses.includes(status)) {
        query += ' AND pp.status = ?';
        params.push(status);
    } else {
        query += ' AND pp.status = "Aceptado"';
    }

    query += ' ORDER BY pp.practicePositionID DESC';

    const [results] = await pool.query(query, params);
    return results;
};

// Eliminación lógica de la vacante
const softDelete = async (practicePositionID) => {
  const [positionRows] = await pool.query(
    'SELECT recordStatus FROM PracticePosition WHERE practicePositionID = ?',
    [practicePositionID]
  );

  if (positionRows.length === 0) {
    throw new Error('La vacante no existe');
  }

  if (positionRows[0].recordStatus === 'Eliminado') {
    throw new Error('La vacante ya fue eliminada');
  }

  const [result] = await pool.query(
    'UPDATE PracticePosition SET recordStatus = "Eliminado" WHERE practicePositionID = ?',
    [practicePositionID]
  );

  return result;
};


// Eliminación lógica de postulaciones relacionadas
const softDeleteApplicationsByPositionID = async (practicePositionID) => {
  await pool.query(
    'UPDATE PracticeApplication SET recordStatus = "Eliminado" WHERE practicePositionID = ?',
    [practicePositionID]
  );
};


// Actualización parcial de vacante
const patchPosition = async (practicePositionID, updateData) => {
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error("No se proporcionaron campos para actualizar");
  }

  const keys = Object.keys(updateData);
  const values = [];

  const setClause = keys.map(key => {
    values.push(updateData[key]);
    return `${key} = ?`;
  }).join(", ");

  const query = `
    UPDATE PracticePosition
    SET ${setClause}
    WHERE practicePositionID = ? AND recordStatus = 'Activo'
  `;

  values.push(practicePositionID);

  const [result] = await pool.query(query, values);
  if (result.affectedRows === 0) {
    throw new Error("No se pudo actualizar la vacante o ya fue eliminada");
  }

  // Devolver la vacante actualizada
  const [updatedRows] = await pool.query(
    'SELECT * FROM PracticePosition WHERE practicePositionID = ?',
    [practicePositionID]
  );

  return updatedRows[0];
};

module.exports = {
    getPositionByID,
    getPositionsByCompanyID,
    getAllPositions,
    getPositionsByStatus,
    createPosition,
    softDelete,
    softDeleteApplicationsByPositionID,
    patchPosition
};
