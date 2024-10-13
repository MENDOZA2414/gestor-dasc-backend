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
    const { email, password } = req.body;

    try {
        const user = await authenticateUser(email, password);

        // Generar el token JWT
        const token = jwt.sign(
            { 
                id: user.userID, 
                email: user.email, 
                roleID: user.roleID, 
                userTypeID: user.userTypeID // Incluir userTypeID en el token
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        res.cookie('token', token, { httpOnly: true, secure: true }); // Para cookies
        res.setHeader('Authorization', `Bearer ${token}`); // Para headers

        // Retornar el token y el userTypeID al cliente
        res.status(200).send({ 
            message: 'Login exitoso', 
            token,
            userTypeID: user.userTypeID // Enviar el userTypeID al cliente
        });
    } catch (error) {
        res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
    }
};


module.exports = { registerUserController, loginUserController };
