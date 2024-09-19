const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Registrar el usuario dentro de una transacción utilizando la conexión
const registrarUsuario = async (connection, correo, contraseña, numCelular, rolID) => {
    // Generar un hash seguro para la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

    // Query de inserción utilizando la conexión de la transacción
    const query = `INSERT INTO usuarios (correo, contraseña, numCelular, rolID) VALUES (?, ?, ?, ?)`;
    const [result] = await connection.query(query, [correo, hashedPassword, numCelular, rolID]);

    return result.insertId; // Retornar el ID del usuario recién creado
};

// Iniciar sesión de usuario
const autenticarUsuario = async (correo, contraseña) => {
    const query = `SELECT * FROM usuarios WHERE correo = ?`;
    const [result] = await pool.query(query, [correo]);

    if (result.length > 0) {
        const usuario = result[0];

        // Comparar la contraseña con el hash almacenado
        const isPasswordValid = await bcrypt.compare(contraseña, usuario.contraseña);
        if (isPasswordValid) {
            return usuario; // Retorna los datos del usuario autenticado
        } else {
            throw new Error('Contraseña incorrecta');
        }
    } else {
        throw new Error('Correo no encontrado');
    }
};

module.exports = { registrarUsuario, autenticarUsuario };
