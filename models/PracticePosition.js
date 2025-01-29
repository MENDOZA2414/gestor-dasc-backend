const pool = require('../config/db');

const getPositionByID = async (practicePositionID) => {
    const query = 'SELECT * FROM PracticePosition WHERE practicePositionID = ?';
    const [result] = await pool.query(query, [practicePositionID]);
    if (result.length > 0) {
        let position = result[0];
        if (position.logoEmpresa) {
            position.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(position.logoEmpresa).toString('base64')}`;
        }
        return position;
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
        WHERE pp.companyID = ? 
        ORDER BY pp.practicePositionID DESC
    `;
    const [results] = await pool.query(query, [companyID]);
    results.forEach(row => {
        if (row.companyLogo) {
            row.companyLogo = `data:image/jpeg;base64,${Buffer.from(row.companyLogo).toString('base64')}`;
        }
    });
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
        ORDER BY pp.practicePositionID DESC 
        LIMIT ?, ?
    `;
    const [results] = await pool.query(query, [start, limit]);
    results.forEach(row => {
        if (row.companyLogo) {
            row.companyLogo = `data:image/jpeg;base64,${Buffer.from(row.companyLogo).toString('base64')}`;
        }
    });
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
      WHERE 1=1
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
    results.forEach(row => {
        if (row.companyLogo) {
            row.companyLogo = `data:image/jpeg;base64,${Buffer.from(row.companyLogo).toString('base64')}`;
        }
    });
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

const deletePosition = async (practicePositionID) => {
    const checkStatusQuery = 'SELECT status FROM PracticePosition WHERE practicePositionID = ?';
    const deleteQuery = 'DELETE FROM PracticePosition WHERE practicePositionID = ?';

    const [result] = await pool.query(checkStatusQuery, [practicePositionID]);

    if (result.length > 0 && result[0].status === 'Accepted') {
        await pool.query(deleteQuery, [practicePositionID]);
        return { message: 'Vacante eliminada con éxito' };
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
