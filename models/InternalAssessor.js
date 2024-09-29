const pool = require('../config/db');
const { registerUser } = require('./User');

// Registrar un asesor interno
const registerInternalAssessor = async (assessorData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { email, password, phone, firstName, firstLastName, secondLastName } = assessorData;

        // Registrar el usuario primero en la tabla 'User'
        const userID = await registerUser(connection, email, password, phone, 2); // 2 sería el roleID para Internal Assessor

        // Insertar en la tabla 'InternalAssessor'
        const query = `
            INSERT INTO InternalAssessor (userID, firstName, firstLastName, secondLastName)
            VALUES (?, ?, ?, ?)
        `;
        await connection.query(query, [userID, firstName, firstLastName, secondLastName]);

        // Confirmar la transacción
        await connection.commit();
        return { message: 'Internal Assessor successfully registered' };

    } catch (error) {
        // Revertir la transacción si hay un error
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Liberar la conexión
    }
};

// Obtener un asesor interno por ID
const getInternalAssessorByID = async (internalAssessorID) => {
    const query = 'SELECT * FROM InternalAssessor WHERE internalAssessorID = ?';
    const [results] = await pool.query(query, [internalAssessorID]);
    if (results.length > 0) {
        const assessor = results[0];
        if (assessor.photo) {
            assessor.photo = assessor.photo.toString('base64');
        }
        return assessor;
    } else {
        throw new Error('Internal Assessor does not exist');
    }
};

// Obtener todos los asesores internos
const getAllInternalAssessors = async () => {
    const query = 'SELECT internalAssessorID, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName FROM InternalAssessor';
    const [results] = await pool.query(query);
    return results;
};

// Contar el número de asesores internos
const countInternalAssessors = async () => {
    const query = 'SELECT COUNT(*) as count FROM InternalAssessor';
    const [results] = await pool.query(query);
    return results[0].count;
};

module.exports = {
    registerInternalAssessor,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors
};