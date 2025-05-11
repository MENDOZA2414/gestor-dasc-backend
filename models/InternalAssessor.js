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
    const query = 'SELECT * FROM InternalAssessor WHERE internalAssessorID = ? AND recordStatus = "Activo"';
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
    const query = 'SELECT internalAssessorID, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName FROM InternalAssessor WHERE recordStatus = "Activo"';
    const [results] = await pool.query(query);
    return results;
};

// Contar el número de asesores internos
const countInternalAssessors = async () => {
    const query = 'SELECT COUNT(*) as count FROM InternalAssessor WHERE recordStatus = "Activo"';
    const [results] = await pool.query(query);
    return results[0].count;
};

// Eliminar lógicamente un asesor interno y su usuario
const deleteInternalAssessor = async (internalAssessorID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT userID FROM InternalAssessor WHERE internalAssessorID = ? AND recordStatus = "Activo"',
            [internalAssessorID]
        );

        if (rows.length === 0) throw new Error('El asesor interno no existe o ya fue eliminado');

        const { userID } = rows[0];

        await connection.query(
            'UPDATE InternalAssessor SET recordStatus = "Eliminado" WHERE internalAssessorID = ?',
            [internalAssessorID]
        );

        await connection.query(
            'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
            [userID]
        );

        await connection.commit();
        return { message: 'Asesor interno y usuario marcados como eliminados' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Actualizar datos del asesor interno
const updateInternalAssessor = async (internalAssessorID, updateData) => {
    const { firstName, firstLastName, secondLastName } = updateData;

    const query = `
        UPDATE InternalAssessor
        SET firstName = ?, firstLastName = ?, secondLastName = ?
        WHERE internalAssessorID = ? AND recordStatus = "Activo"
    `;
    const [result] = await pool.query(query, [
        firstName,
        firstLastName,
        secondLastName,
        internalAssessorID
    ]);

    if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar el asesor o ya fue eliminado');
    }

    return { message: 'Asesor interno actualizado correctamente' };
};

module.exports = {
    registerInternalAssessor,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors,
    deleteInternalAssessor,
    updateInternalAssessor
};
