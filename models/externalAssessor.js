const pool = require('../config/db');
const { registerUser } = require('./users');

// Registrar un asesor externo
const registerExternalAssessor = async (assessorData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { email, password, phone, firstName, firstLastName, secondLastName, companyID, professionID, position, phoneNumber } = assessorData;

        // Registrar el usuario primero en la tabla 'User'
        const userID = await registerUser(connection, email, password, phone, 2); // 2 sería el roleID para external assessor

        // Insertar en la tabla 'ExternalAssessor'
        const query = `
            INSERT INTO ExternalAssessor (userID, companyID, firstName, firstLastName, secondLastName, professionID, position, phoneNumber)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [userID, companyID, firstName, firstLastName, secondLastName, professionID, position, phoneNumber]);

        // Confirmar la transacción
        await connection.commit();
        return { message: 'Asesor Externo registrado exitosamente' };

    } catch (error) {
        // Revertir la transacción si hay un error
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Liberar la conexión
    }
};

// Obtener un asesor externo por ID
const getExternalAssessorByID = async (externalAssessorID) => {
    const query = 'SELECT * FROM ExternalAssessor WHERE externalAssessorID = ?';
    const [results] = await pool.query(query, [externalAssessorID]);
    if (results.length > 0) {
        const assessor = results[0];
        if (assessor.photo) {
            assessor.photo = assessor.photo.toString('base64');
        }
        return assessor;
    } else {
        throw new Error('No existe el asesor externo');
    }
};

module.exports = {
    registerExternalAssessor,
    getExternalAssessorByID
};
