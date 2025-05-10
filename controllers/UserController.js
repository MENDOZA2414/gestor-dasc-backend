const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { registerUser, authenticateUser } = require('../models/User');

// Registrar usuario
const registerUserController = async (req, res) => {
  const { email, password, phone, roleID, userTypeID } = req.body;

  if (!email || !password || !phone || !roleID || !userTypeID) {
    return res.status(400).send({ message: 'Faltan datos requeridos' });
  }

  try {
    const connection = await pool.getConnection();
    await registerUser(connection, email, password, phone, roleID, userTypeID);
    connection.release();
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
        jwt.verify(currentToken, process.env.JWT_SECRET);
        return res.status(409).send({ code: 'SESSION_ACTIVE', message: 'Sesión activa detectada' });
      } catch (err) {
        // Limpiar sessionToken
        await pool.query('UPDATE User SET sessionToken = NULL WHERE userID = ?', [user.userID]);
      }
    }

    // Generar un nuevo sessionToken
    const sessionToken = jwt.sign(
      { userID: user.userID, time: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '1d' : '1h' }
    ); 
    

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
      { expiresIn: rememberMe ? '1d' : '1h' }
    );

    // Enviar cookie con JWT
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: rememberMe ? 1 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000 // 7 días o 1 hora
    });

    // Obtener el controlNumber si es un estudiante
    let controlNumber = null;

    if (user.userTypeID === 2) {
      const [result] = await pool.query('SELECT controlNumber FROM Student WHERE userID = ?', [user.userID]);
      controlNumber = result[0]?.controlNumber || null;
    }

    // Respuesta
    res.status(200).send({
      message: 'Login exitoso',
      userTypeID: user.userTypeID,
      userID: user.userID,
      controlNumber,
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

// Obtener usuario por ID (si está activo)
const getUserByIDController = async (req, res) => {
  const { userID } = req.params;

  try {
    const user = await getUserByID(userID);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).send({ message: 'Usuario no encontrado', error: error.message });
  }
};

// Actualizar email y teléfono de un usuario
const updateUserController = async (req, res) => {
  const { userID } = req.params;
  const updateData = req.body;

  try {
    const result = await updateUser(userID, updateData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).send({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar lógicamente un usuario
const deleteUserController = async (req, res) => {
  const { userID } = req.params;

  try {
    const result = await deleteUser(userID);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserByIDController,
  updateUserController,
  deleteUserController
};
