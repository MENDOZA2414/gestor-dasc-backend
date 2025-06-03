const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const {
  registerUser,
  authenticateUser,
  patchUser,
  deleteUser,
} = require('../models/User');

const UserRole = require('../models/UserRole');
const { isTargetAdminUser } = require('../utils/checkTargetIsAdmin');
const { isValidEmail, isValidPhone, isValidPassword } = require('../utils/validators/commonValidators');
const Notification = require('../models/Notification');

// Registrar usuario
exports.registerUserController = async (req, res) => {
  const { email, password, phone, userTypeID } = req.body;

  // Verificación de campos requeridos
  if (!email || !password || !phone || !userTypeID) {
    return res.status(400).send({ message: 'Faltan datos requeridos' });
  }

  // Validaciones de formato
  if (!isValidEmail(email)) {
    return res.status(400).send({ message: 'Formato de correo electrónico no válido' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).send({ message: 'El teléfono debe tener 10 dígitos numéricos' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).send({
      message: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula, número y símbolo'
    });
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
      await Notification.create({
        type: 'NuevoUsuario',
        message: `Se ha registrado un nuevo usuario con ID ${userID}`
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

    // Validar estado de usuario antes de continuar
    if (![99].includes(user.userTypeID)) {  // Excepto adminOnly
      let table = '';
      switch (user.userTypeID) {
        case 1: table = 'InternalAssessor'; break;
        case 2: table = 'Student'; break;
        case 3: table = 'ExternalAssessor'; break;
        case 4: table = 'Company'; break;
      }

      if (table) {
        const [statusRows] = await pool.query(
          `SELECT status, recordStatus FROM ${table} WHERE userID = ?`,
          [user.userID]
        );

        if (statusRows.length === 0 || statusRows[0].recordStatus !== 'Activo') {
          return res.status(401).send({
            message: 'Usuario no encontrado o inactivo.'
          });
        }

        const currentStatus = statusRows[0].status;
        if (currentStatus !== 'Aceptado') {
          return res.status(401).send({
            message: `Tu cuenta está en estado "${currentStatus}". Comunícate con el administrador a practicas@uabcs.mx.`
          });
        }
      }
    }

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

    // Generar un nuevo sessionToken (interno)
    const sessionToken = jwt.sign(
      { userID: user.userID, time: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '1d' : '1h' }
    );

    // Guardar el nuevo sessionToken en la BD
    await pool.query('UPDATE User SET sessionToken = ? WHERE userID = ?', [sessionToken, user.userID]);

    // Obtener userTypeName desde la base de datos
    const [userTypeRow] = await pool.query(`
      SELECT ut.userTypeName
      FROM User u
      JOIN UserType ut ON u.userTypeID = ut.userTypeID
      WHERE u.userID = ?
    `, [user.userID]);

    const userTypeName = userTypeRow[0]?.userTypeName || null;

    // Obtener los roles del usuario
    const rolesResult = await UserRole.getRolesByUserID(user.userID);
    const roles = rolesResult.map(r => r.roleName);

    // Generar token de acceso (JWT principal)
    const token = jwt.sign(
      {
        id: user.userID,
        email: user.email,
        userTypeID: user.userTypeID,
        userTypeName,
        roles,
        sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '1d' : '1h' }
    );

    // Enviar cookie con el JWT
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: rememberMe ? 1 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
    });

    // Obtener el controlNumber si es un estudiante
    let controlNumber = null;
    if (user.userTypeID === 2) {
      const [result] = await pool.query('SELECT controlNumber FROM Student WHERE userID = ?', [user.userID]);
      controlNumber = result[0]?.controlNumber || null;
    }

    // Respuesta final
    res.status(200).send({
      message: 'Login exitoso',
      userTypeID: user.userTypeID,
      userTypeName,
      userID: user.userID,
      controlNumber,
      roles,
      token
    });

  } catch (error) {
    let clientMessage = 'Correo o contraseña incorrectos';
    let devMessage = error.message;

    try {
      const parsed = JSON.parse(error.message);
      clientMessage = parsed.client || clientMessage;
      devMessage = parsed.dev || devMessage;
    } catch (_) {
      // Si no se puede parsear, se deja el mensaje por defecto
    }

    console.error('Error en login:', devMessage);

    res.status(401).send({
      message: clientMessage,
      // error: process.env.NODE_ENV === 'development' ? devMessage : undefined
    });
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

// Obtener usuario por ID (solo Admins o SuperAdmin)
exports.getUserByIDController = async (req, res) => {
  const { userID } = req.params;
  const loggedUserID = req.user.id;
  const loggedUserRoles = req.user.roles || [];

  try {
    // Si el usuario autenticado no es SuperAdmin, y quiere ver a otro Admin → no se lo permitas
    if (
      loggedUserRoles.includes('Admin') &&
      parseInt(userID) !== parseInt(loggedUserID)
    ) {
      // Verificamos si el usuario objetivo es también Admin
      const [target] = await pool.query(`
        SELECT ut.userTypeName
        FROM User u
        JOIN UserType ut ON u.userTypeID = ut.userTypeID
        WHERE u.userID = ?
      `, [userID]);

      const isTargetAdmin = target[0]?.userTypeName === 'adminOnly';

      if (isTargetAdmin) {
        return res.status(403).json({ message: 'No puedes ver la información de otro administrador.' });
      }
    }

    // Obtener información del usuario
    const [userResult] = await pool.query(`
      SELECT u.userID, u.email, u.phone, ut.userTypeName
      FROM User u
      JOIN UserType ut ON u.userTypeID = ut.userTypeID
      WHERE u.userID = ? AND u.recordStatus = 'Activo'
    `, [userID]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = userResult[0];

    // Obtener roles del usuario objetivo
    const roles = await UserRole.getRolesByUserID(userID);

    res.status(200).json({ user, roles });

  } catch (error) {
    console.error('Error en getUserByIDController:', error.message);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// Obtener perfil de usuario y roles
exports.getUserProfileAndRoles = async (req, res) => {
  try {
    const userID = req.user.id;

    // Primero obtenemos el userTypeID
    const [[userTypeResult]] = await pool.query(`
      SELECT userTypeID FROM User WHERE userID = ? AND recordStatus = 'Activo'
    `, [userID]);

    if (!userTypeResult) {
      return res.status(404).json({ message: 'Usuario no encontrado', error: 'Usuario no encontrado o eliminado' });
    }

    const userTypeID = userTypeResult.userTypeID;

    let user;

    // Si es admin (99), obtenemos también fullName 
    if (userTypeID === 99) {
      const [[adminData]] = await pool.query(`
        SELECT userID, email, phone, fullName
        FROM User
        WHERE userID = ? AND recordStatus = 'Activo'
      `, [userID]);

      user = {
        ...adminData,
        userTypeName: 'adminOnly'
      };
    } else {
      const [userResult] = await pool.query(`
        SELECT u.userID, u.email, u.phone, ut.userTypeName
        FROM User u
        JOIN UserType ut ON u.userTypeID = ut.userTypeID
        WHERE u.userID = ? AND u.recordStatus = 'Activo'
      `, [userID]);

      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado', error: 'Usuario no encontrado o eliminado' });
      }

      user = userResult[0];
    }

    // Roles
    const roles = await UserRole.getRolesByUserID(userID);

    res.status(200).json({ user, roles });

  } catch (error) {
    console.error('Error en /me:', error.message);
    res.status(500).json({ message: 'Error al obtener perfil y roles' });
  }
};

// Actualizar usuario parcialmente (email, teléfono, recordStatus)
exports.patchUserController = async (req, res) => {
  try {
    const { userID } = req.params;
    const updateData = req.body;

    const loggedUserID = req.user.id;
    const loggedUserRoles = req.user.roles || [];

    const isAdmin = loggedUserRoles.includes('Admin');
    const isSuperAdmin = loggedUserRoles.includes('SuperAdmin');
    const isSelf = parseInt(userID) === parseInt(loggedUserID);

    // 1. Si es Admin (pero NO SuperAdmin) y quiere editar a otro Admin o SuperAdmin → denegar
    if (isAdmin && !isSuperAdmin && !isSelf) {
      const isTargetAdmin = await isTargetAdminUser(userID, 'Admin');
      const isTargetSuperAdmin = await isTargetAdminUser(userID, 'SuperAdmin');
      if (isTargetAdmin || isTargetSuperAdmin) {
        return res.status(403).json({ message: 'No puedes editar a otro administrador.' });
      }
    }

    // 2. Validar campos si se van a modificar
    if (updateData.email && !isValidEmail(updateData.email)) {
      return res.status(400).json({ message: 'Formato de correo electrónico no válido.' });
    }

    if (updateData.phone && !isValidPhone(updateData.phone)) {
      return res.status(400).json({ message: 'El teléfono debe tener 10 dígitos.' });
    }

    // 3. Restringir campos según el rol
    if (!isSuperAdmin) {
      if ('email' in updateData && !isAdmin) {
        return res.status(403).json({ message: 'No tienes permiso para cambiar tu correo electrónico.' });
      }
    }

    // 4. Si es usuario normal (ni Admin ni SuperAdmin), solo puede editarse a sí mismo
    if (!isAdmin && !isSuperAdmin && !isSelf) {
      return res.status(403).json({ message: 'No tienes permiso para editar a otros usuarios.' });
    }

    // 5. Obtener los datos actuales del usuario
    const [currentUserData] = await pool.query(
      'SELECT email, phone, recordStatus FROM User WHERE userID = ?',
      [userID]
    );

    if (currentUserData.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o eliminado.' });
    }

    const current = currentUserData[0];

    // 6. Comparar si los valores ingresados son iguales a los actuales
    const isSame =
      (!updateData.email || updateData.email === current.email) &&
      (!updateData.phone || updateData.phone === current.phone) &&
      (!updateData.recordStatus || updateData.recordStatus === current.recordStatus);

    if (isSame) {
      return res.status(200).json({
        message: 'Los datos ingresados son iguales a los actuales. No se realizó ningún cambio.'
      });
    }

    // 7. Ejecutar actualización
    const result = await patchUser(userID, updateData);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Error en patchUserController:', error.message);
    return res.status(400).json({
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Cambiar estado de usuario (solo SuperAdmin)
exports.patchUserStatusController = async (req, res) => {
  try {
    const { userID } = req.params;
    const { recordStatus } = req.body;
    const loggedUserRoles = req.user.roles || [];

    if (!loggedUserRoles.includes('SuperAdmin')) {
      return res.status(403).json({ message: 'Solo el SuperAdmin puede cambiar el estado de un usuario.' });
    }

    const validStatuses = ['Activo', 'Eliminado'];
    if (!validStatuses.includes(recordStatus)) {
      return res.status(400).json({ message: 'Estado no válido. Debe ser "Activo" o "Eliminado".' });
    }

    // 1. Obtener el userTypeID para saber la tabla secundaria
    const [userRow] = await pool.query('SELECT userTypeID FROM User WHERE userID = ?', [userID]);
    if (userRow.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const userTypeID = userRow[0].userTypeID;

    // 2. Actualizar estado en la tabla User
    const [updateUser] = await pool.query(
      'UPDATE User SET recordStatus = ? WHERE userID = ?',
      [recordStatus, userID]
    );

    if (updateUser.affectedRows === 0) {
      return res.status(404).json({ message: 'No se pudo actualizar el estado del usuario.' });
    }

    let secondaryTable = '';
    let statusField = '';
    let secondaryStatus = null;

    // 3. Si se activó, también actualizar la tabla secundaria
    if (recordStatus === 'Activo') {
      switch (userTypeID) {
        case 1:
          secondaryTable = 'InternalAssessor';
          statusField = 'status';
          break;
        case 2:
          secondaryTable = 'Student';
          statusField = 'status';
          break;
        case 3:
          secondaryTable = 'ExternalAssessor';
          statusField = 'status';
          break;
        case 4:
          secondaryTable = 'Company';
          statusField = 'status';
          break;
        default:
          break;
      }

      if (secondaryTable && statusField) {
        const [updateSecondary] = await pool.query(
          `UPDATE ${secondaryTable} SET recordStatus = 'Activo', ${statusField} = 'Pendiente' WHERE userID = ?`,
          [userID]
        );

        if (updateSecondary.affectedRows > 0) {
          secondaryStatus = 'Pendiente';
        }
      }
    } else if (recordStatus === 'Eliminado') {
      // Eliminar también en tabla secundaria
      switch (userTypeID) {
        case 1: secondaryTable = 'InternalAssessor'; break;
        case 2: secondaryTable = 'Student'; break;
        case 3: secondaryTable = 'ExternalAssessor'; break;
        case 4: secondaryTable = 'Company'; break;
        default: break;
      }

      if (secondaryTable) {
        await pool.query(
          `UPDATE ${secondaryTable} SET recordStatus = 'Eliminado' WHERE userID = ?`,
          [userID]
        );
      }
    }

    return res.status(200).json({
      message: 'Usuario actualizado correctamente',
      recordStatus,
      secondaryStatus
    });

  } catch (error) {
    console.error('Error en patchUserStatusController:', error.message);
    res.status(500).json({
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

// Cambiar contraseña
exports.changePasswordController = async (req, res) => {
  try {
    const userID = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Debes proporcionar la contraseña actual y la nueva contraseña.' });
    }

    // Validar seguridad de la nueva contraseña
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
      });
    }

    // Obtener la contraseña actual
    const [rows] = await pool.query(
      'SELECT password FROM User WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o eliminado.' });
    }

    const currentHashed = rows[0].password;

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, currentHashed);
    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual no es correcta.' });
    }

    // Verificar si la nueva es igual a la actual
    const isSamePassword = await bcrypt.compare(newPassword, currentHashed);
    if (isSamePassword) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    // Encriptar nueva contraseña y actualizar
    const hashedNew = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query('UPDATE User SET password = ? WHERE userID = ?', [hashedNew, userID]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No se pudo actualizar la contraseña.' });
    }

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    return res.status(500).json({ message: 'Error interno al cambiar contraseña', error: error.message });
  }
};

// Solicitar restablecimiento de contraseña
exports.requestPasswordResetController = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query('SELECT userID FROM User WHERE email = ? AND recordStatus = "Activo"', [email]);

    if (rows.length === 0) {
      // Nunca respondas si existe o no
      return res.status(200).json({ message: 'Si el correo es válido, se enviará un enlace de recuperación.' });
    }

    const userID = rows[0].userID;

    const token = jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Para esta versión básica, devuélvelo en el body. En producción lo enviarías por email.
    return res.status(200).json({
      message: 'Token de recuperación generado.',
      token
    });

  } catch (err) {
    console.error('Error al solicitar recuperación:', err.message);
    res.status(500).json({ message: 'Error al procesar solicitud.' });
  }
};

// Restablecer contraseña
exports.resetPasswordController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validar seguridad de la nueva contraseña
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
      });
    }

    // Obtener la contraseña actual del usuario
    const [userRows] = await pool.query(
      'SELECT password FROM User WHERE userID = ? AND recordStatus = "Activo"',
      [decoded.userID]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o eliminado.' });
    }

    const currentHashed = userRows[0].password;

    // Comparar la nueva con la actual
    const isSamePassword = await bcrypt.compare(newPassword, currentHashed);
    if (isSamePassword) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual.' });
    }

    // Encriptar y actualizar
    const hashed = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.query(
      'UPDATE User SET password = ? WHERE userID = ?',
      [hashed, decoded.userID]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No se pudo actualizar la contraseña.' });
    }

    return res.status(200).json({ message: 'Contraseña restablecida correctamente.' });

  } catch (err) {
    console.error('Error al restablecer contraseña:', err.message);
    return res.status(400).json({ message: 'Token inválido o expirado.' });
  }
};

// Activar o desactivar usuario (Admin o SuperAdmin, con restricciones)
exports.patchUserActivationStatusController = async (req, res) => {
  try {
    const { userID } = req.params;
    const { recordStatus } = req.body;
    const loggedUserID = req.user.id;
    const loggedUserRoles = req.user.roles || [];

    // Validar estatus permitido
    const validStatuses = ['Activo', 'Inactivo'];
    if (!validStatuses.includes(recordStatus)) {
      return res.status(400).json({ message: 'Estado no válido. Debe ser "Activo" o "Inactivo".' });
    }

    // Validar que exista el usuario a modificar
    const [[targetUser]] = await pool.query(
      'SELECT userID, userTypeID FROM User WHERE userID = ?',
      [userID]
    );
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Obtener roles del usuario objetivo
    const targetRoles = (await UserRole.getRolesByUserID(userID)).map(r => r.roleName);

    // Restricciones:
    if (loggedUserRoles.includes('Admin')) {
      // Un Admin NO puede modificar otro Admin ni al SuperAdmin
      if (targetRoles.includes('Admin') || targetRoles.includes('SuperAdmin')) {
        return res.status(403).json({
          message: 'No tienes permiso para cambiar el estado de un usuario con rol Admin o SuperAdmin.'
        });
      }
    }

    // Actualizar en tabla User
    const [result] = await pool.query(
      'UPDATE User SET recordStatus = ? WHERE userID = ?',
      [recordStatus, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No se pudo actualizar el estado del usuario.' });
    }

    // También actualizar en la tabla secundaria si existe
    const [[{ userTypeID }]] = await pool.query('SELECT userTypeID FROM User WHERE userID = ?', [userID]);
    const tableMap = {
      1: 'InternalAssessor',
      2: 'Student',
      3: 'ExternalAssessor',
      4: 'Company'
    };
    const secondaryTable = tableMap[userTypeID];

    if (secondaryTable) {
      await pool.query(
        `UPDATE ${secondaryTable} SET recordStatus = ? WHERE userID = ?`,
        [recordStatus, userID]
      );
    }

    return res.status(200).json({
      message: `Estado del usuario actualizado a ${recordStatus}`,
      userID
    });

  } catch (error) {
    console.error('Error en patchUserActivationStatusController:', error.message);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Eliminar lógicamente un usuario
exports.deleteUserController = async (req, res) => {
  const { userID } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener el tipo de usuario
    const [[userRow]] = await connection.query(
      'SELECT userTypeID FROM User WHERE userID = ?',
      [userID]
    );

    if (!userRow) {
      connection.release();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userTypeID = userRow.userTypeID;

    // Marcar al usuario como eliminado en la tabla User
    await connection.query(
      'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
      [userID]
    );

    // Marcar en su tabla secundaria
    switch (userTypeID) {
      case 1:
        await connection.query('UPDATE InternalAssessor SET recordStatus = "Eliminado" WHERE userID = ?', [userID]);
        break;
      case 2:
        await connection.query('UPDATE Student SET recordStatus = "Eliminado" WHERE userID = ?', [userID]);
        break;
      case 3:
        await connection.query('UPDATE ExternalAssessor SET recordStatus = "Eliminado" WHERE userID = ?', [userID]);
        break;
      case 4:
        await connection.query('UPDATE Company SET recordStatus = "Eliminado" WHERE userID = ?', [userID]);
        break;
    }

    await connection.commit();
    res.status(200).json({ message: 'Usuario eliminado correctamente' });

  } catch (error) {
    await connection.rollback();
    console.error('Error en deleteUserController:', error.message);
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  } finally {
    connection.release();
  }
};

// Editar el teléfono del propio usuario
exports.patchOwnPhoneController = async (req, res) => {
  const userID = req.user.id;
  const { phone } = req.body;

  if (!phone || phone.trim() === '') {
    return res.status(400).json({ message: 'El número de teléfono es requerido' });
  }

  try {
    await pool.query('UPDATE User SET phone = ? WHERE userID = ?', [phone.trim(), userID]);
    res.status(200).json({ message: 'Número de teléfono actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar teléfono:', error.message);
    res.status(500).json({ message: 'Error interno al actualizar el número de teléfono' });
  }
};

exports.getUnreadNotificationsController = async (req, res) => {
  try {
    const notifications = await Notification.getUnread();
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error.message);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};
