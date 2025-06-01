const PracticePosition = require('../models/PracticePosition');
const getUserRoles = require('../utils/GetUserRoles');
const pool  = require("../config/db");

// Obtener vacante por ID
exports.getPositionByID = async (req, res) => {
  try {
    const positionID = parseInt(req.params.id);
    const userID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const position = await PracticePosition.getPositionByID(positionID);

    if (!position) {
      return res.status(404).json({ message: 'Vacante no encontrada.' });
    }

    const roles = await getUserRoles(userID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, aplicar restricciones
    if (!isAdmin) {
      // Empresa: solo puede ver su propia vacante
      if (userTypeID === 4) {
        const [[company]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [userID]
        );

        if (!company || company.companyID !== position.companyID) {
          return res.status(403).json({ message: 'No puedes acceder a vacantes de otras empresas.' });
        }
      }

      // Estudiante o asesor interno: solo puede ver si está aceptada
      if ((userTypeID === 1 || userTypeID === 2) && position.status !== 'Aceptado') {
        return res.status(403).json({ message: 'Solo puedes ver vacantes aceptadas.' });
      }
    }

    res.status(200).json(position);

  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).send({ message: 'Error en el servidor' });
  }
};

// Obtener vacantes por ID de empresa
exports.getPositionsByCompanyID = async (req, res) => {
  try {
    const entidadID = parseInt(req.params.entidadID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que sea la empresa propietaria
    if (!isAdmin) {
      if (userTypeID !== 4 || requesterID !== entidadID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar vacantes de otra empresa.' });
      }
    }

    const positions = await PracticePosition.getPositionsByCompanyID(entidadID);

    if (!positions.length) {
      return res.status(404).json({ message: 'No hay vacantes asociadas a esta entidad.' });
    }

    res.status(200).json(positions);

  } catch (error) {
    console.error('Error al obtener vacantes por entidad:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener todas las vacantes con paginación
exports.getAllPositions = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = parseInt(req.params.limit) || 10;

    const userID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const roles = await getUserRoles(userID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    let query = `
      SELECT pp.*, 
             ea.firstName AS externalAssessorName, 
             ea.firstLastName AS externalAssessorLastName, 
             ea.secondLastName AS externalAssessorSecondLastName, 
             er.companyName AS companyName, 
             er.photo AS companyLogo 
      FROM PracticePosition pp
      JOIN ExternalAssessor ea ON pp.externalAssessorID = ea.externalAssessorID
      JOIN Company er ON pp.companyID = er.companyID
      WHERE pp.recordStatus = 'Activo'
    `;
    const queryParams = [];

    if (isAdmin) {
      // No se aplica filtro adicional
    } else if (userTypeID === 4) {
      // Empresa: solo ve sus propias vacantes
      const [[company]] = await pool.query(
        'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
        [userID]
      );

      if (!company) {
        return res.status(403).json({ message: 'Empresa no encontrada.' });
      }

      query += ' AND pp.companyID = ?';
      queryParams.push(company.companyID);

    } else if (userTypeID === 1 || userTypeID === 2) {
      // Estudiantes o asesores: solo ven vacantes aceptadas
      query += ' AND pp.status = "Aceptado"';
    }

    query += ' ORDER BY pp.practicePositionID DESC LIMIT ?, ?';
    queryParams.push((page - 1) * limit, limit);

    const [results] = await pool.query(query, queryParams);
    res.status(200).json(results);

  } catch (error) {
    console.error('Error en getAllPositions:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
// Obtener vacantes por estatus
exports.getPositionsByStatus = async (req, res) => {
  try {
    const requestedStatus = req.query.status;
    const userTypeID = req.user.userTypeID;
    const userID = req.user.id;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(userID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, solo puede consultar status='Aceptado'
    if (!isAdmin && requestedStatus !== 'Aceptado') {
      return res.status(403).json({ message: 'Solo puedes consultar vacantes aceptadas.' });
    }

    const positions = await PracticePosition.getPositionsByStatus(requestedStatus);
    res.status(200).json(positions);

  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).send({ message: 'Error en el servidor' });
  }
};

// Crear vacante
exports.createPosition = async (req, res) => {
  try {
    const userID = req.user.id;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    let companyID;

    if (isAdmin) {
      companyID = req.body.companyID;

      if (!companyID) {
        return res.status(400).json({ message: 'Debe proporcionar el companyID al crear vacantes como administrador.' });
      }

      // Validar que la empresa exista y esté activa
      const [[company]] = await pool.query(
        'SELECT companyID FROM Company WHERE companyID = ? AND recordStatus = "Activo"',
        [companyID]
      );

      if (!company) {
        return res.status(404).json({ message: 'Empresa no encontrada o inactiva.' });
      }

    } else {
      // Caso usuario tipo empresa
      const [[company]] = await pool.query(
        'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
        [userID]
      );

      if (!company) {
        return res.status(404).json({ message: 'Empresa no encontrada para este usuario.' });
      }

      companyID = company.companyID;
    }

    const {
      positionName, description, startDate,
      endDate, maxStudents, externalAssessorID,
      city, positionType
    } = req.body;

    // Validación básica
    if (
      !positionName || !description || !startDate ||
      !endDate || !maxStudents || !city || !positionType ||
      !externalAssessorID
    ) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para crear la vacante.' });
    }

    const newPosition = await PracticePosition.createPosition({
      positionName,
      startDate,
      endDate,
      city,
      positionType,
      description,
      companyID,
      externalAssessorID,
      maxStudents,
      status: 'Pendiente'
    });

    res.status(201).json({
      message: 'Vacante creada con éxito',
      data: newPosition
    });

  } catch (error) {
    console.error('Error al crear la vacante:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Eliminación lógica de una vacante (y postulaciones si se desea)
exports.deletePositionControlled = async (req, res) => {
  try {
    const { id } = req.params;

    // Leer from query: ?withApplications=true
    const withApplications = req.query.withApplications === 'true';

    // Obtener la vacante
    const position = await PracticePosition.getPositionByID(id);
    if (!position || position.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Vacante no encontrada o ya eliminada.' });
    }

    if (position.status === 'Aceptado') {
      return res.status(403).json({ message: 'No puedes eliminar una vacante ya aceptada.' });
    }

    // Eliminar lógicamente la vacante
    await PracticePosition.softDelete(id);

    // Eliminar postulaciones si se solicitó
    if (withApplications) {
      await PracticePosition.softDeleteApplicationsByPositionID(id);
    }

    return res.status(200).json({
      message: `Vacante eliminada correctamente${withApplications ? ' junto con sus postulaciones' : ''}.`
    });

  } catch (error) {
    console.error('Error al eliminar vacante:', error.message);
    res.status(500).json({
      message: 'No se pudo eliminar la vacante.',
      error: error.message
    });
  }
};

// Actualizar el estatus de una vacante
exports.patchPositionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pendiente', 'Aceptado', 'Rechazado', 'Cerrado', 'Inactiva'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estatus no válido.' });
    }

    // Verificar existencia
    const position = await PracticePosition.getPositionByID(id);
    if (!position || position.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Vacante no encontrada o eliminada.' });
    }

    // Actualizar status
    const result = await PracticePosition.patchPosition(id, { status });
    return res.status(200).json({ message: 'Estatus actualizado correctamente.', data: result });

  } catch (error) {
    console.error('Error al actualizar estatus:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Actualizar parcialmente una vacante
exports.patchPositionController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    // Obtener la vacante actual
    const position = await PracticePosition.getPositionByID(id);
    if (!position || position.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'La vacante no existe o ha sido eliminada.' });
    }

    // Verificar si es Admin o SuperAdmin
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es Admin, validar si es la empresa propietaria
    if (!isAdmin) {
      if (userTypeID !== 4) {
        return res.status(403).json({ message: 'No tienes permiso para modificar esta vacante.' });
      }

      // Obtener el companyID del usuario
      const [[company]] = await pool.query(
        'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      if (!company || company.companyID !== position.companyID) {
        return res.status(403).json({ message: 'No tienes permiso para modificar esta vacante.' });
      }

      // Empresas no pueden editar si ya está aceptada
      if (position.status === 'Aceptado') {
        return res.status(403).json({ message: 'No puedes modificar una vacante ya aceptada.' });
      }
    }

    // Bloquear campos restringidos para todos
    const forbiddenFields = ['recordStatus', 'status', 'companyID'];
    for (const field of forbiddenFields) {
      if (field in updateData) {
        return res.status(400).json({ message: `El campo '${field}' no se puede modificar desde aquí.` });
      }
    }

    // Ejecutar actualización
    const updated = await PracticePosition.patchPosition(id, updateData);
    return res.status(200).json({ message: 'Vacante actualizada correctamente.', data: updated });

  } catch (error) {
    console.error('Error al actualizar vacante:', error.message);
    return res.status(500).json({
      message: 'No se pudo actualizar la vacante.',
      error: error.message
    });
  }
};
