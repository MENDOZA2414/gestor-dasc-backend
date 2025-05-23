const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
  registerUser,
  authenticateUser,
  getUserByID,
  patchUser,
  deleteUser
} = require('../models/User');
const {
  assignRolesToUser
} = require('../models/UserRole'); 
const UserRole = require('../models/UserRole');

// Registrar usuario
exports.registerUserController = async (req, res) => {
  const { email, password, phone, userTypeID } = req.body;

  if (!email || !password || !phone || !userTypeID) {
    return res.status(400).send({ message: 'Faltan datos requeridos' });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const userID = await registerUser(connection, email, password, phone, userTypeID);

      await connection.commit();
      res.status(201).send({
        message: 'Usuario registrado con éxito',
        userID
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).send({ message: 'Error al registrar el usuario', error: error.message });
  }
};

// Iniciar sesión
exports.loginUserController = async (req, res) => {
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

    // Si override es true, limpiar el token anterior (aunque sea válido)
    if (override) {
      await pool.query('UPDATE User SET sessionToken = NULL WHERE userID = ?', [user.userID]);
    }
    
    // Generar un nuevo sessionToken
    const sessionToken = jwt.sign(
      { userID: user.userID, time: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '1d' : '1h' }
    );

    // Guardar en la base de datos
    await pool.query('UPDATE User SET sessionToken = ? WHERE userID = ?', [sessionToken, user.userID]);

    const token = jwt.sign(
      {
        id: user.userID,
        email: user.email,
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
    
    // Obtener los roles del usuario
    const rolesResult = await UserRole.getRolesByUserID(user.userID);

    const roles = rolesResult.map(r => r.roleName);
    
    // Respuesta
    res.status(200).send({
      message: 'Login exitoso',
      userTypeID: user.userTypeID,
      userID: user.userID,
      controlNumber,
      roles,
      token
    });

  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(401).send({ message: 'Correo o contraseña incorrectos', error: error.message });
  }
};

// Cerrar sesión
exports.logoutUserController = async (req, res) => {
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
exports.getUserByIDController = async (req, res) => {
  const { userID } = req.params;

  try {
    const user = await getUserByID(userID);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).send({ message: 'Usuario no encontrado', error: error.message });
  }
};

// Obtener perfil de usuario y roles
exports.getUserProfileAndRoles = async (req, res) => {
  try {
    const userID = req.user.id;

    const [userResult] = await pool.query(`
      SELECT u.userID, u.email, u.phone, ut.userTypeName
      FROM User u
      JOIN UserType ut ON u.userTypeID = ut.userTypeID
      WHERE u.userID = ? AND u.recordStatus = 'Activo'
    `, [userID]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado', error: 'Usuario no encontrado o eliminado' });
    }

    const user = userResult[0];
    const roles = await UserRole.getRolesByUserID(userID);

    res.status(200).json({ user, roles });

  } catch (error) {
    console.error('Error en /me:', error.message);
    res.status(500).json({ message: 'Error al obtener perfil y roles' });
  }
};

// Actualizar usuario parcialmente (email o teléfono)
exports.patchUserController = async (req, res) => {
  try {
    const { userID } = req.params;
    const updateData = req.body;

    const result = await patchUser(userID, updateData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).send({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar lógicamente un usuario
exports.deleteUserController = async (req, res) => {
  const { userID } = req.params;

  try {
    const result = await deleteUser(userID);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error al eliminar el usuario', error: error.message });
  }
};
