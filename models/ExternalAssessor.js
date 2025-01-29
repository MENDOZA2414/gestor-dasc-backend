// Modelo para gestionar las operaciones de asesores externos.

const pool = require('../config/db');
const { registerUser } = require('./User');

// Registrar un asesor externo
const registerExternalAssessor = async (assessorData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { email, password, phone, firstName, firstLastName, secondLastName, companyID, professionID, position } = assessorData;

        // Validaciones previas
        if (!email || !password || !firstName || !firstLastName || !companyID) {
            throw new Error('Datos obligatorios faltantes para registrar el asesor externo');
        }

        // Registrar el usuario en la tabla 'User'
        const userID = await registerUser(connection, email, password, phone, 2); // RoleID: 2 (asesor externo)

        // Insertar en la tabla 'ExternalAssessor'
        const query = `
            INSERT INTO ExternalAssessor (
                userID, companyID, firstName, firstLastName, secondLastName, professionID, position, phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            userID, companyID, firstName, firstLastName, secondLastName, professionID, position, phone
        ]);

        await connection.commit();
        return { message: 'Asesor externo registrado exitosamente' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Obtener un asesor externo por ID
const getExternalAssessorByID = async (externalAssessorID) => {
    const query = 'SELECT * FROM ExternalAssessor WHERE externalAssessorID = ?';
    const [results] = await pool.query(query, [externalAssessorID]);

    if (results.length === 0) {
        throw new Error('El asesor externo no existe');
    }

    return results[0];
};

// Obtener todos los asesores externos
const getAllExternalAssessors = async () => {
    const query = `
        SELECT 
            externalAssessorID, 
            CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName, 
            companyID, 
            position 
        FROM ExternalAssessor
        ORDER BY firstName
    `;
    const [results] = await pool.query(query);
    return results;
};

// Obtener asesores externos por empresa
const getExternalAssessorsByCompanyID = async (companyID) => {
    const query = `
        SELECT 
            externalAssessorID, 
            CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName, 
            position 
        FROM ExternalAssessor
        WHERE companyID = ?
        ORDER BY firstName
    `;
    const [results] = await pool.query(query, [companyID]);

    if (results.length === 0) {
        throw new Error('No se encontraron asesores externos para esta empresa');
    }

    return results;
};

// Actualizar un asesor externo
const updateExternalAssessor = async (externalAssessorID, updateData) => {
    const { firstName, firstLastName, secondLastName, professionID, position } = updateData;

    const query = `
        UPDATE ExternalAssessor
        SET firstName = ?, firstLastName = ?, secondLastName = ?, professionID = ?, position = ?
        WHERE externalAssessorID = ?
    `;
    const [result] = await pool.query(query, [
        firstName, 
        firstLastName, 
        secondLastName, 
        professionID, 
        position, 
        externalAssessorID
    ]);

    if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar el asesor externo o no existe');
    }

    return { message: 'Asesor externo actualizado exitosamente' };
};

// Eliminar un asesor externo
const deleteExternalAssessor = async (externalAssessorID) => {
    const query = 'DELETE FROM ExternalAssessor WHERE externalAssessorID = ?';
    const [result] = await pool.query(query, [externalAssessorID]);

    if (result.affectedRows === 0) {
        throw new Error('No se pudo eliminar el asesor externo o no existe');
    }

    return { message: 'Asesor externo eliminado exitosamente' };
};

module.exports = {
    registerExternalAssessor,
    getExternalAssessorByID,
    getAllExternalAssessors,
    getExternalAssessorsByCompanyID,
    updateExternalAssessor,
    deleteExternalAssessor
};
