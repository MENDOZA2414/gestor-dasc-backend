const pool = require('../config/db');
const { registrarUsuario } = require('./users');

// Registrar un asesor interno
const registrarAsesorInterno = async (asesorData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { correo, contraseña, numCelular, nombre, apellidoPaterno, apellidoMaterno } = asesorData;

        // Registrar el usuario primero en la tabla 'usuarios'
        const usuarioID = await registrarUsuario(connection, correo, contraseña, numCelular, 2); // 2 sería el rolID para asesor interno

        // Insertar en la tabla 'asesorInterno'
        const query = `
            INSERT INTO asesorInterno (usuarioID, nombre, apellidoPaterno, apellidoMaterno)
            VALUES (?, ?, ?, ?)
        `;
        await connection.query(query, [usuarioID, nombre, apellidoPaterno, apellidoMaterno]);

        // Confirmar la transacción
        await connection.commit();
        return { message: 'Asesor Interno registrado exitosamente' };

    } catch (error) {
        // Revertir la transacción si hay un error
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Liberar la conexión
    }
};

// Obtener un asesor interno por ID
const obtenerAsesorInternoPorID = async (asesorInternoID) => {
    const query = 'SELECT * FROM asesorInterno WHERE asesorInternoID = ?';
    const [resultados] = await pool.query(query, [asesorInternoID]);
    if (resultados.length > 0) {
        const asesor = resultados[0];
        if (asesor.fotoPerfil) {
            asesor.fotoPerfil = asesor.fotoPerfil.toString('base64');
        }
        return asesor;
    } else {
        throw new Error('No existe el asesor interno');
    }
};

// Obtener todos los asesores internos
const obtenerTodosLosAsesoresInternos = async () => {
    const query = 'SELECT asesorInternoID, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombreCompleto FROM asesorInterno';
    const [resultados] = await pool.query(query);
    return resultados;
};

// Contar el número de asesores internos
const contarAsesoresInternos = async () => {
    const query = 'SELECT COUNT(*) as count FROM asesorInterno';
    const [resultados] = await pool.query(query);
    return resultados[0].count;
};

module.exports = {
    registrarAsesorInterno,
    obtenerAsesorInternoPorID,
    obtenerTodosLosAsesoresInternos,
    contarAsesoresInternos
};
