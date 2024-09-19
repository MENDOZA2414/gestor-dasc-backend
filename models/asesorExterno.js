const pool = require('../config/db');
const { registrarUsuario } = require('./users');

// Registrar un asesor externo
const registrarAsesorExterno = async (asesorData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { correo, contraseña, numCelular, nombre, apellidoPaterno, apellidoMaterno, entidadID, profesionID, cargo, telefono } = asesorData;

        // Registrar el usuario primero en la tabla 'usuarios'
        const usuarioID = await registrarUsuario(connection, correo, contraseña, numCelular, 2); // 2 sería el rolID para asesor externo

        // Insertar en la tabla 'asesorExterno'
        const query = `
            INSERT INTO asesorExterno (usuarioID, entidadID, nombre, apellidoPaterno, apellidoMaterno, profesionID, cargo, telefono)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [usuarioID, entidadID, nombre, apellidoPaterno, apellidoMaterno, profesionID, cargo, telefono]);

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

const obtenerAsesorExternoPorID = async (asesorExternoID) => {
    const query = 'SELECT * FROM asesorExterno WHERE asesorExternoID = ?';
    const [resultados] = await pool.query(query, [asesorExternoID]);
    if (resultados.length > 0) {
        const asesor = resultados[0];
        if (asesor.fotoPerfil) {
            asesor.fotoPerfil = asesor.fotoPerfil.toString('base64');
        }
        return asesor;
    } else {
        throw new Error('No existe el asesor externo');
    }
};

module.exports = {
    registrarAsesorExterno,
    obtenerAsesorExternoPorID
};
