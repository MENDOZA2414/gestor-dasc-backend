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

    // Obtener token actual de la BD
    const [sessionResult] = await pool.query('SELECT sessionToken FROM User WHERE userID = ?', [user.userID]);
    const currentToken = sessionResult[0]?.sessionToken;

    // Si hay token existente
    if (currentToken && !override) {
      try {
        // Verificamos si el token aún es válido
        jwt.verify(currentToken, process.env.JWT_SECRET);

        // Si es válido y no hay override, denegar login
        return res.status(409).send({ message: 'Ya hay una sesión activa para este usuario.' });
      } catch (err) {
        // Si el token ha expirado o es inválido, permitimos continuar
      }
    }

    // Generar un nuevo sessionToken
    const sessionToken = uuidv4();

    // Guardar en la base de datos
    await pool.query('UPDATE User SET sessionToken = ? WHERE userID = ?', [sessionToken, user.userID]);

    // Generar JWT con sessionToken
    const token = jwt.sign(
      {
        id: user.userID,
        email: user.email,
        roleID: user.roleID,
        userTypeID: user.userTypeID,
        sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? 6 * 60 : 4 * 60 } // minutos de prueba
    );

    // Enviar cookie con JWT
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: rememberMe ? 6 * 60 * 1000 : 4 * 60 * 1000 // en milisegundos
    });

    // Respuesta
    res.status(200).send({
      message: 'Login exitoso',
      userTypeID: user.userTypeID,
      token
    });

  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
  }
};

// Cerrar sesión
const logoutUserController = async (req, res) => {
  const cookieToken = req.cookies.token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await pool.query('UPDATE User SET sessionToken = NULL WHERE userID = ?', [decoded.id]);
    } catch (err) {
      // Token inválido o expirado, no se hace nada
    }
  }

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
