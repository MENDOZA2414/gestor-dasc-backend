const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Registrar el usuario dentro de una transacción utilizando la conexión
const registerUser = async (connection, email, password, phone, userTypeID) => {
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
    const [existingUserByEmail] = await connection.query(
        'SELECT * FROM User WHERE email = ?', [email]
    );
    if (existingUserByEmail.length > 0) {
        throw new Error('El email ya está registrado');
    }

    // Verificar si el teléfono ya está registrado
    const [existingUserByPhone] = await connection.query(
        'SELECT * FROM User WHERE phone = ?', [phone]
    );
    if (existingUserByPhone.length > 0) {
        throw new Error('El teléfono ya está registrado');
    }

    // Generar hash seguro para la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario
    const insertQuery = `
        INSERT INTO User (email, password, phone, userTypeID)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await connection.query(insertQuery, [email, hashedPassword, phone, userTypeID]);

    const userID = result.insertId;

    return userID;
};

// Iniciar sesión de usuario
const authenticateUser = async (email, password) => {
    const query = `SELECT * FROM User WHERE email = ?`;
    const [result] = await pool.query(query, [email]);

    if (result.length === 0) {
        throw new Error('El correo electrónico no está registrado');
    }

    const user = result[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
    }

    return {
        userID: user.userID,
        email: user.email,
        phone: user.phone,
        userTypeID: user.userTypeID
    };
};

// Obtener usuarios activos (para listar)
const getActiveUsers = async () => {
    const query = `SELECT * FROM User WHERE recordStatus = 'Activo'`;
    const [results] = await pool.query(query);
    return results;
};

// Obtener un usuario activo por ID
const getUserByID = async (userID) => {
    const query = `SELECT * FROM User WHERE userID = ? AND recordStatus = 'Activo'`;
    const [results] = await pool.query(query, [userID]);

    if (results.length === 0) {
        throw new Error('Usuario no encontrado o eliminado');
    }

    return results[0];
};

// Actualizar email y teléfono
const patchUser = async (userID, updateData) => {
    const fields = [];
    const values = [];

    if (updateData.email) {
        const [[exists]] = await pool.query(
            "SELECT userID FROM User WHERE email = ? AND userID != ? AND recordStatus = 'Activo'",
            [updateData.email, userID]
        );
        if (exists) throw new Error("El correo electrónico ya está en uso");
        fields.push("email = ?");
        values.push(updateData.email);
    }

    if (updateData.phone) {
        const [[exists]] = await pool.query(
            "SELECT userID FROM User WHERE phone = ? AND userID != ? AND recordStatus = 'Activo'",
            [updateData.phone, userID]
        );
        if (exists) throw new Error("El número de teléfono ya está en uso");
        fields.push("phone = ?");
        values.push(updateData.phone);
    }

    if (fields.length === 0) {
        throw new Error("No se proporcionaron campos válidos para actualizar");
    }

    const query = `
        UPDATE User
        SET ${fields.join(", ")}
        WHERE userID = ? AND recordStatus = 'Activo'
    `;

    values.push(userID);
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("No se pudo actualizar el usuario");
    }

    return { message: "Usuario actualizado correctamente" };
};

// Eliminar lógicamente un usuario
const deleteUser = async (userID) => {
    const query = `UPDATE User SET recordStatus = 'Eliminado' WHERE userID = ?`;
    const [result] = await pool.query(query, [userID]);

    if (result.affectedRows === 0) {
        throw new Error('No se pudo eliminar el usuario o no existe');
    }

    return { message: 'Usuario marcado como eliminado' };
};

module.exports = {
    registerUser,
    authenticateUser,
    getActiveUsers,
    getUserByID,
    patchUser,
    deleteUser
};
