const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Registrar el usuario dentro de una transacción utilizando la conexión
const registerUser = async (connection, email, password, phone, roleID, userTypeID) => {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Formato de email no válido');
    }

    // Validar longitud del teléfono
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        throw new Error('El número de teléfono debe tener 10 dígitos numéricos');
    }

    // Verificar si el email ya está registrado
    const checkEmailQuery = 'SELECT * FROM User WHERE email = ?';
    const [existingUserByEmail] = await connection.query(checkEmailQuery, [email]);
    if (existingUserByEmail.length > 0) {
        throw new Error('El email ya está registrado');
    }

    // Verificar si el teléfono ya está registrado
    const checkPhoneQuery = 'SELECT * FROM User WHERE phone = ?';
    const [existingUserByPhone] = await connection.query(checkPhoneQuery, [phone]);
    if (existingUserByPhone.length > 0) {
        throw new Error('El teléfono ya está registrado');
    }

    // Generar un hash seguro para la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar el nuevo usuario con el roleID y userTypeID
    const query = `INSERT INTO User (email, password, phone, roleID, userTypeID) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await connection.query(query, [email, hashedPassword, phone, roleID, userTypeID]);

    return result.insertId; // Retornar el ID del usuario recién creado
};

// Iniciar sesión de usuario
const authenticateUser = async (email, password) => {
    const query = `SELECT * FROM User WHERE email = ?`;
    const [result] = await pool.query(query, [email]);

    if (result.length === 0) {
        throw new Error('El correo electrónico no está registrado');
    }

    const user = result[0];

    // (Opcional) Verificar si el usuario está activo
    if (user.status !== 'activo') {
        throw new Error('La cuenta está inactiva o bloqueada');
    }

    // Comparar la contraseña con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
    }

    // Retornar los datos del usuario, incluyendo el userTypeID
    return {
        userID: user.userID,
        email: user.email,
        phone: user.phone,
        roleID: user.roleID,
        userTypeID: user.userTypeID 
    };
};

module.exports = { registerUser, authenticateUser };
