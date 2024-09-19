const { registrarUsuario, autenticarUsuario } = require('../models/users');

// Controlador para registrar un usuario
const registrarUsuarioController = async (req, res) => {
    const { correo, contraseña, numCelular, rolID } = req.body;

    try {
        await registrarUsuario(correo, contraseña, numCelular, rolID);
        res.status(201).send({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).send({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// Controlador para iniciar sesión
const loginUsuarioController = async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        const usuario = await autenticarUsuario(correo, contraseña);
        res.status(200).send({ message: 'Login exitoso', usuario });
    } catch (error) {
        res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
    }
};

module.exports = { registrarUsuarioController, loginUsuarioController };
