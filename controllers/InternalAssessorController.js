const InternalAssessor = require('../models/InternalAssessor');
const getUserRoles = require('../utils/GetUserRoles');

// Registrar un asesor interno
const registerInternalAssessorController = async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      firstName,
      lastName,
      career
    } = req.body;

    // Validar campos obligatorios
    if (!email || !password || !phone || !firstName || !lastName || !career) {
      return res.status(400).json({ message: 'Faltan datos requeridos para registrar al asesor interno.' });
    }

    const assessorData = {
      email,
      password,
      phone,
      firstName,
      lastName,
      career,
      status: 'Pendiente',
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null
    };

    const result = await InternalAssessor.registerInternalAssessor(assessorData);
    res.status(201).json({
      message: 'Registro exitoso. El acceso será habilitado cuando un administrador apruebe tu solicitud.',
      data: result
    });

  } catch (error) {
    console.error('Error al registrar el asesor interno:', error.message);
    res.status(500).send({ message: 'Error al registrar el asesor interno', error: error.message });
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
      if (userTypeID !== 1 || requesterID !== internalAssessorID) {
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
    res.status(200).json({ total: count }); 
  } catch (error) {
    console.error('Error en la consulta de prueba:', error.message);
    res.status(500).json({ message: 'Error en el servidor ejecutando la consulta de prueba', error: error.message });
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

    const result = await InternalAssessor.patchInternalAssessor(internalAssessorID, updateData);
    res.status(200).json({ message: 'Asesor actualizado correctamente', result });

  } catch (error) {
    console.error('Error al actualizar parcialmente el asesor interno:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar el asesor interno', error: error.message });
  }
};

module.exports = {
    registerInternalAssessorController,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors,
    deleteInternalAssessor,
    patchInternalAssessorController
};
