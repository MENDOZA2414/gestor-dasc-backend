const InternalAssessor = require('../models/InternalAssessor');
const getUserRoles = require('../utils/GetUserRoles');
const pool = require('../config/db');

// Registrar un asesor interno
const registerInternalAssessorController = async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      firstName,
      firstLastName,
      secondLastName
    } = req.body;

    // Validar campos obligatorios
    if (!email || !password || !phone || !firstName || !firstLastName) {
      return res.status(400).json({ message: 'Faltan datos requeridos para registrar al asesor interno.' });
    }

    // Preparar objeto de registro
    const assessorData = {
      email,
      password,
      phone,
      firstName,
      firstLastName,
      secondLastName: secondLastName || null,
      status: 'Pendiente', // estado inicial hasta que el admin lo apruebe
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null
    };

    // Registrar en la base de datos
    const result = await InternalAssessor.registerInternalAssessor(assessorData);

    // Respuesta exitosa
    return res.status(201).json({
      message: 'Registro exitoso. El acceso será habilitado cuando un administrador apruebe tu solicitud.',
      data: result
    });

  } catch (error) {
    console.error('Error al registrar el asesor interno:', error.message);
    return res.status(500).json({ message: 'Error al registrar el asesor interno', error: error.message });
  }
};

// Obtener un asesor interno por ID
const getInternalAssessorByID = async (req, res) => {
  try {
    const internalAssessorID = parseInt(req.params.id);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que sea el propio asesor
    if (!isAdmin) {
      if (userTypeID !== 1) {
        return res.status(403).json({ message: 'Solo los asesores internos pueden acceder a esta información.' });
      }

      // Buscar su propio registro de InternalAssessor
      const [[ownRecord]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      if (!ownRecord || ownRecord.internalAssessorID !== internalAssessorID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar este perfil.' });
      }
    }


    const assessor = await InternalAssessor.getInternalAssessorByID(internalAssessorID);
    if (!assessor) {
      return res.status(404).json({ message: 'Asesor interno no encontrado.' });
    }

    res.status(200).json(assessor);

  } catch (error) {
    console.error('Error al obtener el asesor interno:', error.message);
    res.status(500).json({ message: 'Error al obtener el asesor interno' });
  }
};

// Obtener todos los asesores internos
const getAllInternalAssessors = async (req, res) => {
  try {
    const assessors = await InternalAssessor.getAllInternalAssessors();

    if (!assessors || assessors.length === 0) {
      return res.status(404).json({ message: 'No se encontraron asesores internos activos.' });
    }

    res.status(200).json(assessors);

  } catch (error) {
    console.error('Error al obtener los asesores internos:', error.message);
    res.status(500).json({ message: 'Error al obtener los asesores internos', error: error.message });
  }
};

// Contar asesores internos (prueba de conexión)
const countInternalAssessors = async (req, res) => {
  try {
    const count = await InternalAssessor.countInternalAssessors();
    res.status(200).json({ total: count.total });
  } catch (error) {
    console.error('Error al contar asesores internos:', error.message);
    res.status(500).json({ message: 'Error al contar asesores internos', error: error.message });
  }
};

// Eliminar un asesor interno por ID (eliminación lógica)
const deleteInternalAssessor = async (req, res) => {
  try {
    const internalAssessorID = parseInt(req.params.id);

    // Verificar si el asesor existe y está activo
    const assessor = await InternalAssessor.getInternalAssessorByID(internalAssessorID);

    if (!assessor || assessor.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Asesor interno no encontrado o ya eliminado.' });
    }

    // Proceder con la eliminación lógica
    const result = await InternalAssessor.deleteInternalAssessor(internalAssessorID);
    res.status(200).json({
      message: 'Asesor interno eliminado correctamente.',
      result
    });

  } catch (error) {
    console.error('Error al eliminar el asesor interno:', error.message);
    res.status(500).json({ message: 'No se pudo eliminar el asesor interno', error: error.message });
  }
};

// Actualizar un asesor interno por ID
const patchInternalAssessorController = async (req, res) => {
  try {
    const internalAssessorID = parseInt(req.params.id);
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    // Verificar que el asesor exista
    const existing = await InternalAssessor.getInternalAssessorByID(internalAssessorID);
    if (!existing || existing.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Asesor interno no encontrado o ya eliminado.' });
    }

    // Separar campos que pertenecen a la tabla User
    const userFields = ['email', 'phone'];
    const userUpdates = {};
    const internalUpdates = {};

    for (const key in updateData) {
      if (userFields.includes(key)) {
        userUpdates[key] = updateData[key];
      } else if (key !== 'recordStatus' && key !== 'status') {
        internalUpdates[key] = updateData[key];
      }
    }

    // Actualizar tabla InternalAssessor
    let internalResult = null;
    if (Object.keys(internalUpdates).length > 0) {
      internalResult = await InternalAssessor.patchInternalAssessor(internalAssessorID, internalUpdates);
    }

    // Actualizar tabla User
    let userResult = null;
    if (Object.keys(userUpdates).length > 0) {
      const [userRow] = await pool.query('SELECT userID FROM InternalAssessor WHERE internalAssessorID = ?', [internalAssessorID]);
      const userID = userRow[0]?.userID;
      if (!userID) {
        return res.status(404).json({ message: 'Usuario asociado no encontrado.' });
      }

      const fields = Object.keys(userUpdates).map(field => `${field} = ?`).join(', ');
      const values = Object.values(userUpdates);
      values.push(userID);

      await pool.query(`UPDATE User SET ${fields} WHERE userID = ?`, values);
      userResult = { message: 'Datos de usuario actualizados' };
    }

    return res.status(200).json({
      message: 'Asesor actualizado correctamente',
      internalResult,
      userResult
    });
  } catch (error) {
    console.error('Error al actualizar parcialmente el asesor interno:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar el asesor interno', error: error.message });
  }
};

// Cambiar el status operativo de un asesor interno
const updatestatus = async (req, res) => {
  const { userID } = req.params;
  const { status } = req.body;
  const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido. Usa: Aceptado, Rechazado o Pendiente.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE InternalAssessor SET status = ? WHERE userID = ? AND recordStatus = "Activo"',
      [status, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asesor interno no encontrado o eliminado.' });
    }

    return res.status(200).json({ message: `Status actualizado a "${status}" correctamente.` });
  } catch (error) {
    console.error('Error al actualizar status:', error.message);
    return res.status(500).json({ message: 'Error interno al actualizar status.', error: error.message });
  }
};

module.exports = {
    registerInternalAssessorController,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors,
    deleteInternalAssessor,
    patchInternalAssessorController,
    updatestatus 
};


