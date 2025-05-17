// Controlador para gestionar las operaciones de asesores externos

const ExternalAssessor = require('../models/ExternalAssessor');
const getUserRoles = require('../utils/GetUserRoles');

// Registrar un asesor externo
const registerExternalAssessorController = async (req, res) => {
  try {
    const companyID = req.user.id; // empresa autenticada
    const {
      email,
      password,
      phone,
      firstName,
      lastName
    } = req.body;

    // Validar campos requeridos
    if (!email || !password || !phone || !firstName || !lastName) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para registrar al asesor externo.' });
    }

    const assessorData = {
      email,
      password,
      phone,
      firstName,
      lastName,
      companyID,
      status: 'Pendiente', // ← importante
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null
    };

    const result = await ExternalAssessor.registerExternalAssessor(assessorData);

    res.status(201).json({
      message: 'Asesor registrado. Será activado cuando un administrador apruebe la solicitud.',
      data: result
    });

  } catch (error) {
    console.error('Error al registrar asesor externo:', error.message);
    res.status(500).json({
      message: 'No se pudo registrar el asesor externo',
      error: error.message
    });
  }
};

// Obtener un asesor externo por ID
const getExternalAssessorByIDController = async (req, res) => {
  try {
    const externalAssessorID = parseInt(req.params.id);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!externalAssessorID) {
      return res.status(400).json({ message: 'ID del asesor externo requerido' });
    }

    const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);

    if (!assessor || assessor.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Asesor externo no encontrado o eliminado.' });
    }

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Validar permisos
    const isSameCompany = (userTypeID === 4 && assessor.companyID === requesterID);

    if (!isAdmin && !isSameCompany) {
      return res.status(403).json({ message: 'No tienes permiso para acceder a este asesor externo.' });
    }

    res.status(200).json(assessor);

  } catch (error) {
    console.error('Error en consulta por ID:', error.message);
    res.status(500).json({ message: 'No se pudo obtener el asesor externo', error: error.message });
  }
};

// Obtener todos los asesores externos
const getAllExternalAssessorsController = async (req, res) => {
  try {
    const assessors = await ExternalAssessor.getAllExternalAssessors();

    if (!assessors || assessors.length === 0) {
      return res.status(404).json({ message: 'No se encontraron asesores externos activos.' });
    }

    res.status(200).json(assessors);

  } catch (error) {
    console.error('Error en consulta general:', error.message);
    res.status(500).json({
      message: 'No se pudo obtener la lista de asesores externos',
      error: error.message
    });
  }
};

// Obtener asesores externos por empresa
const getExternalAssessorsByCompanyIDController = async (req, res) => {
  try {
    const companyID = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!companyID) {
      return res.status(400).json({ message: 'ID de la empresa requerido' });
    }

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, debe ser la empresa dueña
    if (!isAdmin && (userTypeID !== 4 || requesterID !== companyID)) {
      return res.status(403).json({ message: 'No tienes permiso para consultar los asesores de esta empresa.' });
    }

    const assessors = await ExternalAssessor.getExternalAssessorsByCompanyID(companyID);

    if (!assessors || assessors.length === 0) {
      return res.status(404).json({ message: 'No se encontraron asesores registrados para esta empresa.' });
    }

    res.status(200).json(assessors);

  } catch (error) {
    console.error('Error en consulta por empresa:', error.message);
    res.status(500).json({
      message: 'No se pudieron obtener los asesores externos por empresa',
      error: error.message
    });
  }
};

// Actualizar un asesor externo
const patchExternalAssessorController = async (req, res) => {
  try {
    const externalAssessorID = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Datos de actualización requeridos' });
    }

    // Verificar existencia del asesor externo
    const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);
    if (!assessor || assessor.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Asesor externo no encontrado o eliminado.' });
    }

    // Verificar permisos
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');
    const isSameCompany = userTypeID === 4 && assessor.companyID === requesterID;

    if (!isAdmin && !isSameCompany) {
      return res.status(403).json({ message: 'No tienes permiso para editar este asesor externo.' });
    }

    const result = await ExternalAssessor.patchExternalAssessor(externalAssessorID, updateData);
    res.status(200).json({ message: 'Asesor actualizado correctamente', result });

  } catch (error) {
    console.error('Error al actualizar asesor externo:', error.message);
    res.status(500).json({
      message: 'No se pudo actualizar el asesor externo',
      error: error.message
    });
  }
};

// Eliminar un asesor externo
const deleteExternalAssessorController = async (req, res) => {
  try {
    const externalAssessorID = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!externalAssessorID) {
      return res.status(400).json({ message: 'ID del asesor externo requerido' });
    }

    // Verificar que el asesor exista
    const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);
    if (!assessor || assessor.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Asesor externo no encontrado o ya eliminado.' });
    }

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isSuperAdmin = roles.includes('SuperAdmin');
    const isOwnerCompany = userTypeID === 4 && assessor.companyID === requesterID;

    if (!isSuperAdmin && !isOwnerCompany) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este asesor externo.' });
    }

    const result = await ExternalAssessor.deleteExternalAssessor(externalAssessorID);
    res.status(200).json({ message: 'Asesor externo eliminado correctamente', result });

  } catch (error) {
    console.error('Error en eliminación:', error.message);
    res.status(500).json({ message: 'No se pudo eliminar el asesor externo', error: error.message });
  }
};

module.exports = {
    registerExternalAssessorController,
    getExternalAssessorByIDController,
    getAllExternalAssessorsController,
    getExternalAssessorsByCompanyIDController,
    patchExternalAssessorController,
    deleteExternalAssessorController,
};
