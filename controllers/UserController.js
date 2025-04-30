const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { registerUser, authenticateUser } = require('../models/User');

// Registrar usuario
const registerUserController = async (req, res) => {
  const { email, password, phone, roleID } = req.body;

  try {
    await registerUser(email, password, phone, roleID);
    res.status(201).send({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).send({ message: 'Error al registrar el usuario', error: error.message });
  }
};

// Iniciar sesión
const loginUserController = async (req, res) => {
  const { email, password, rememberMe, override = false } = req.body;

  try {
    const user = await authenticateUser(email, password);

    // Verificar si hay una sesión activa
    const [sessionResult] = await pool.query('SELECT sessionToken FROM User WHERE userID = ?', [user.userID]);
    const currentToken = sessionResult[0]?.sessionToken;

    if (currentToken && !override) {
      return res.status(409).send({ message: 'Ya hay una sesión activa para este usuario.' });
    }

    // Generar y guardar nuevo sessionToken
    const sessionToken = uuidv4();
    await pool.query('UPDATE User SET sessionToken = ? WHERE userID = ?', [sessionToken, user.userID]);

    // Crear token JWT con sessionToken incluido
    const token = jwt.sign(
      {
        id: user.userID,
        email: user.email,
        roleID: user.roleID,
        userTypeID: user.userTypeID,
        sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: rememberMe ? 6 * 60 * 1000 : 4 * 60 * 1000
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

// Cerrar sesión
const logoutUserController = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });
  res.status(200).send({ message: 'Sesión cerrada correctamente' });
};

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController
};
