const pool = require('../config/db');

const getPositionByID = async (practicePositionID) => {
    const query = 'SELECT * FROM PracticePosition WHERE practicePositionID = ? AND recordStatus = "Activo"';
    const [result] = await pool.query(query, [practicePositionID]);
    if (result.length > 0) {
        return result[0];
    } else {
        throw new Error('No existe la vacante');
    }
};

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

    if (status) {
        query += ' AND pp.status = ?';
        params.push(status);
    } else {
        query += ' AND (pp.status IS NULL OR pp.status = "")';
    }

    query += ' ORDER BY pp.practicePositionID DESC';

    const [results] = await pool.query(query, params);
    return results;
};

const createPosition = async (positionData) => {
    const { positionName, startDate, endDate, city, positionType, description, companyID, externalAssessorID } = positionData;

    const insertQuery = `
        INSERT INTO PracticePosition (positionName, startDate, endDate, city, positionType, description, companyID, externalAssessorID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertQuery, [positionName, startDate, endDate, city, positionType, description, companyID, externalAssessorID]);

    const selectQuery = `SELECT * FROM PracticePosition WHERE practicePositionID = ?`;
    const [result2] = await pool.query(selectQuery, [result.insertId]);
    return result2[0];
};

// Eliminación lógica
const deletePosition = async (practicePositionID) => {
    const checkStatusQuery = 'SELECT status FROM PracticePosition WHERE practicePositionID = ?';
    const [result] = await pool.query(checkStatusQuery, [practicePositionID]);

    if (result.length > 0 && result[0].status === 'Aceptado') {
        const updateQuery = 'UPDATE PracticePosition SET recordStatus = "Eliminado" WHERE practicePositionID = ?';
        await pool.query(updateQuery, [practicePositionID]);
        return { message: 'Vacante marcada como eliminada' };
    } else {
        throw new Error('Solo se pueden eliminar elementos aceptados');
    }
};

// TODO (2025-01-28): Revisar eliminación en cascada para PracticePosition y StudentApplication
const deletePositionAndApplications = async (positionID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const deleteApplicationsQuery = 'DELETE FROM StudentApplication WHERE practicePositionID = ?';
        await connection.query(deleteApplicationsQuery, [positionID]);

        const deletePositionQuery = 'DELETE FROM PracticePosition WHERE practicePositionID = ?';
        await connection.query(deletePositionQuery, [positionID]);

        await connection.commit();
        return { message: 'Vacante y sus postulaciones eliminadas con éxito' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getPositionByID,
    getPositionsByCompanyID,
    getAllPositions,
    getPositionsByStatus,
    createPosition,
    deletePosition,
    deletePositionAndApplications
};
