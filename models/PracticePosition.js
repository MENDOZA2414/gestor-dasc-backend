const pool = require('../config/db');

// Creación de vacante
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

// Eliminación vacante
const deletePosition = async (practicePositionID) => {
    const checkStatusQuery = 'SELECT status FROM PracticePosition WHERE practicePositionID = ?';
    const [result] = await pool.query(checkStatusQuery, [practicePositionID]);

    if (result.length > 0 && ['Aceptado', 'Cerrado'].includes(result[0].status)) {
        const updateQuery = 'UPDATE PracticePosition SET recordStatus = "Eliminado" WHERE practicePositionID = ?';
        await pool.query(updateQuery, [practicePositionID]);
        return { message: 'Vacante marcada como eliminada' };
    } else {
        throw new Error('Solo se pueden eliminar vacantes aceptadas o cerradas');
    }
};

// Actualización parcial de vacante (PATCH)
const patchPosition = async (practicePositionID, updateData) => {
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    const validStatuses = ['Pendiente', 'Aceptado', 'Rechazado', 'Inactiva', 'Cerrado'];

    if (updateData.status && !validStatuses.includes(updateData.status)) {
        throw new Error("Estatus no válido");
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

    return { message: "Vacante actualizada correctamente" };
};

// TODO (2025-01-28): Revisar eliminación en cascada para PracticePosition y StudentApplication
// Eliminación de vacante y postulaciones
const deletePositionAndApplications = async (positionID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const updateApplicationsQuery = `
            UPDATE StudentApplication 
            SET recordStatus = 'Eliminado' 
            WHERE practicePositionID = ? AND recordStatus = 'Activo'
        `;
        await connection.query(updateApplicationsQuery, [positionID]);

        const updatePositionQuery = `
            UPDATE PracticePosition 
            SET recordStatus = 'Eliminado' 
            WHERE practicePositionID = ? AND recordStatus = 'Activo'
        `;
        await connection.query(updatePositionQuery, [positionID]);

        await connection.commit();
        return { message: 'Vacante y sus postulaciones marcadas como eliminadas' };
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
    patchPosition,
    deletePositionAndApplications
};
