const jwt = require('jsonwebtoken');
const { registerUser, authenticateUser } = require('../models/User');

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
    const { email, password, rememberMe } = req.body;

    try {
        const user = await authenticateUser(email, password);
        const token = jwt.sign(
            {
                id: user.userID,
                email: user.email,
                roleID: user.roleID,
                userTypeID: user.userTypeID
            },
            process.env.JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true solo en producción
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000 // 7 días o 1 hora
          });          

        res.status(200).send({
            message: 'Login exitoso',
            userTypeID: user.userTypeID
        });
    } catch (error) {
        console.error('Error en login:', error.message); 
        res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
    }
};

 // Controlador para cerrar sesión
const logoutUserController = (req, res) => {
    res.clearCookie('token');
    res.status(200).send({ message: 'Sesión cerrada correctamente' });
};


module.exports = { registerUserController, loginUserController, logoutUserController };
