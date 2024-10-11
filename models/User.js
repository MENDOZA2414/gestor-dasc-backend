const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Registrar el usuario dentro de una transacción utilizando la conexión
const registerUser = async (connection, email, password, phone, roleID) => {
    // Generar un hash seguro para la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Query de inserción utilizando la conexión de la transacción
    const query = `INSERT INTO User (email, password, phone, roleID) VALUES (?, ?, ?, ?)`;
    const [result] = await connection.query(query, [email, hashedPassword, phone, roleID]);

    return result.insertId; // Retornar el ID del usuario recién creado
};

// Iniciar sesión de usuario
const authenticateUser = async (email, password) => {
    const query = `SELECT * FROM User WHERE email = ?`;
    const [result] = await pool.query(query, [email]);

    if (result.length > 0) {
        const user = result[0];

        // Comparar la contraseña con el hash almacenado
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            return user; // Retorna los datos del usuario autenticado
        } else {
            throw new Error('Credenciales incorrecta');
        }
    } else {
        throw new Error('Credenciales no encontrado');
    }
};

module.exports = { registerUser, authenticateUser };
