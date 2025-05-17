const PracticePosition = require('../models/PracticePosition');
const getUserRoles = require('../utils/GetUserRoles');

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

    // Obtener roles
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, aplicar restricciones
    if (!isAdmin) {
      // Empresa: solo puede ver su propia vacante
      if (userTypeID === 4 && userID !== position.companyID) {
        return res.status(403).json({ message: 'No puedes acceder a vacantes de otras empresas.' });
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
    const { page, limit } = req.params;
    const userTypeID = req.user.userTypeID;

    // Determinar si debe filtrar por estado 'Aceptado'
    const onlyAccepted = userTypeID === 1 || userTypeID === 2; // asesor interno o estudiante

    const positions = await PracticePosition.getAllPositions(
      parseInt(page),
      parseInt(limit),
      onlyAccepted
    );

    res.status(200).json(positions);
  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).send({ message: 'Error en el servidor' });
  }
};

// Obtener vacantes por estatus
exports.getPositionsByStatus = async (req, res) => {
  try {
    const requestedStatus = req.query.status;
    const userTypeID = req.user.userTypeID;
    const userID = req.user.id;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

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
    const companyID = req.user.id; 
    const {
      positionName,
      description,
      requiredSkills,
      startDate,
      endDate,
      maxStudents,
      externalAssessorID
    } = req.body;

    // Validar campos requeridos
    if (
      !positionName ||
      !description ||
      !startDate ||
      !endDate ||
      !maxStudents
    ) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para crear la vacante.' });
    }

    const newPosition = await PracticePosition.createPosition({
      companyID,
      positionName,
      description,
      requiredSkills,
      startDate,
      endDate,
      maxStudents,
      externalAssessorID,
      status: 'Pendiente' // por defecto
    });

    res.status(201).json({
      status: 201,
      message: 'Vacante creada con éxito',
      data: newPosition
    });

  } catch (error) {
    console.error('Error al crear la vacante:', error.message);
    res.status(400).send({ message: error.message });
  }
};

// Eliminar vacante 
exports.deletePosition = async (req, res) => {
  try {
    const practicePositionID = parseInt(req.params.practicePositionID);

    // Verificar si la vacante existe
    const position = await PracticePosition.getPositionByID(practicePositionID);
    if (!position) {
      return res.status(404).json({ message: 'La vacante no existe.' });
    }

    // Verificar si la vacante está asociada a alguna práctica activa
    const [activePractices] = await db.query(`
      SELECT practiceID 
      FROM ProfessionalPractice 
      WHERE practicePositionID = ? AND recordStatus = 'Activo'
    `, [practicePositionID]);

    if (activePractices.length > 0) {
      return res.status(403).json({
        message: 'No se puede eliminar esta vacante porque ya está vinculada a una práctica profesional activa.'
      });
    }

    // Proceder con la eliminación lógica
    const result = await PracticePosition.deletePosition(practicePositionID);

    res.status(200).json({ message: 'Vacante y sus postulaciones marcadas como eliminadas', result });

  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).send({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar vacante y sus postulaciones
exports.deletePositionAndApplications = async (req, res) => {
  try {
    const positionID = parseInt(req.params.id);

    // Verificar si hay prácticas profesionales activas vinculadas
    const [linkedPractices] = await db.query(`
      SELECT practiceID 
      FROM ProfessionalPractice 
      WHERE practicePositionID = ? AND recordStatus = 'Activo'
    `, [positionID]);

    if (linkedPractices.length > 0) {
      return res.status(403).json({
        message: 'No se puede eliminar esta vacante porque está vinculada a una práctica profesional activa.'
      });
    }

    // Proceder con la eliminación lógica en cascada
    const result = await PracticePosition.deletePositionAndApplications(positionID);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error al eliminar la vacante y sus postulaciones:', error.message);
    res.status(500).send({ message: 'Error al eliminar la vacante y sus postulaciones: ' + error.message });
  }
};

//Actualizar parcialmente una vacante
exports.patchPositionController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    // Obtener la vacante actual
    const position = await PracticePosition.getPositionByID(id);
    if (!position) {
      return res.status(404).json({ message: 'La vacante no existe.' });
    }

    // Obtener roles
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que la empresa solo modifique su propia vacante y que no esté aceptada
    if (!isAdmin) {
      if (userTypeID !== 4 || requesterID !== position.companyID) {
        return res.status(403).json({ message: 'No tienes permiso para modificar esta vacante.' });
      }

      if (position.status === 'Aceptado') {
        return res.status(403).json({ message: 'No puedes modificar una vacante ya aceptada.' });
      }
    }

    const result = await PracticePosition.patchPosition(id, updateData);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error al actualizar vacante:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar la vacante', error: error.message });
  }
};