const { registerUser, authenticateUser } = require('../models/user');

// Controlador para registrar un usuario
const registerUserController = async (req, res) => {
    const { email, password, phone, roleID } = req.body;

    try {
        await registerUser(email, password, phone, roleID);
        res.status(201).send({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).send({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// Controlador para iniciar sesión
const loginUserController = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await authenticateUser(email, password);
        res.status(200).send({ message: 'Login exitoso', user });
    } catch (error) {
        res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
    }
};

module.exports = { registerUserController, loginUserController };
