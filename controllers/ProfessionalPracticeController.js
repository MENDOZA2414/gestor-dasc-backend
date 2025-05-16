// Controlador para gestionar prácticas profesionales

const ProfessionalPractice = require('../models/ProfessionalPractice');

// Obtener la práctica profesional registrada de un estudiante
exports.getPracticeByStudentID = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const studentID = parseInt(req.params.studentID);

    // Obtener roles del usuario autenticado
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, aplicar restricciones
    if (!isAdmin) {
      // Si es estudiante, solo puede consultar su propia práctica
      if (userTypeID === 2 && requesterID !== studentID) {
        return res.status(403).json({ message: 'No puedes ver prácticas de otro estudiante.' });
      }

      // Si es asesor interno, debe estar asignado al estudiante
      if (userTypeID === 1) {
        const [studentData] = await db.query(
          `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
          [studentID]
        );
        const assignedAssessorID = studentData[0]?.internalAssessorID;
        if (assignedAssessorID !== requesterID) {
          return res.status(403).json({ message: 'No puedes ver prácticas de un alumno que no está asignado a ti.' });
        }
      }
    }

    // Buscar la práctica profesional
    const practice = await ProfessionalPractice.getPracticeByStudentID(studentID);

    if (!practice) {
      return res.status(404).json({ message: 'No se encontró una práctica registrada para este estudiante.' });
    }

    res.status(200).json(practice);

  } catch (error) {
    console.error('Error al obtener la práctica profesional:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas registradas por una empresa
exports.getPracticesByCompanyID = async (req, res) => {
  try {
    const companyID = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, verificar que la empresa solo consulte sus prácticas
    if (!isAdmin) {
      if (userTypeID !== 4 || requesterID !== companyID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar estas prácticas.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByCompanyID(companyID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas registradas para esta empresa.' });
    }

    res.status(200).json(practices);

  } catch (error) {
    console.error('Error al obtener prácticas por empresa:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas asignadas a un asesor externo
exports.getPracticesByExternalAssessorID = async (req, res) => {
  try {
    const externalAssessorID = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Validar acceso si no es admin
    if (!isAdmin) {
      if (userTypeID !== 3 || requesterID !== externalAssessorID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar estas prácticas.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByExternalAssessorID(externalAssessorID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas asignadas para este asesor externo.' });
    }

    res.status(200).json(practices);

  } catch (error) {
    console.error('Error al obtener prácticas por asesor externo:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas asignadas a un asesor interno
exports.getPracticesByInternalAssessorID = async (req, res) => {
  try {
    const internalAssessorID = parseInt(req.params.internalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que sea el asesor interno correcto
    if (!isAdmin) {
      if (userTypeID !== 1 || requesterID !== internalAssessorID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar estas prácticas.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByInternalAssessorID(internalAssessorID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas para este asesor interno.' });
    }

    res.status(200).json(practices);

  } catch (error) {
    console.error('Error al obtener prácticas por asesor interno:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener la práctica de un alumno asignado a un asesor interno específico
exports.getStudentPracticeByAssessor = async (req, res) => {
  try {
    const internalAssessorID = parseInt(req.params.internalAssessorID);
    const studentID = parseInt(req.params.studentID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que el asesor sea el mismo y el alumno esté asignado
    if (!isAdmin) {
      if (userTypeID !== 1 || requesterID !== internalAssessorID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar esta práctica.' });
      }

      // Validar que el estudiante esté asignado al asesor
      const [studentData] = await db.query(
        `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
        [studentID]
      );

      const assignedAssessorID = studentData[0]?.internalAssessorID;
      if (assignedAssessorID !== requesterID) {
        return res.status(403).json({ message: 'El estudiante no está asignado a este asesor interno.' });
      }
    }

    const practice = await ProfessionalPractice.getStudentPracticeByAssessor(internalAssessorID, studentID);

    if (!practice) {
      return res.status(404).json({ message: 'No se encontró una práctica registrada para este alumno bajo ese asesor.' });
    }

    res.status(200).json(practice);

  } catch (error) {
    console.error('Error al obtener práctica del alumno:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas registradas, con filtros opcionales por carrera y estado
exports.getAllPractices = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Solo administradores pueden consultar todas las prácticas registradas.' });
    }

    const { career, status } = req.query;
    const practices = await ProfessionalPractice.getAllPractices(career, status);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas con esos filtros.' });
    }

    res.status(200).json(practices);
  } catch (error) {
    console.error('Error al obtener prácticas:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener estudiantes asignados a un asesor externo
exports.getStudentsByExternalAssessorID = async (req, res) => {
  try {
    const externalAssessorID = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que sea el asesor correcto
    if (!isAdmin) {
      if (userTypeID !== 3 || requesterID !== externalAssessorID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar estos estudiantes.' });
      }
    }

    const students = await ProfessionalPractice.getStudentsByExternalAssessorID(externalAssessorID);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes para este asesor externo.' });
    }

    res.status(200).json(students);

  } catch (error) {
    console.error('Error al obtener estudiantes por asesor externo:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener estudiantes en prácticas en una institución específica
exports.getStudentsByCompanyID = async (req, res) => {
  try {
    const companyID = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const [rolesRows] = await db.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que sea la empresa correcta
    if (!isAdmin) {
      if (userTypeID !== 4 || requesterID !== companyID) {
        return res.status(403).json({ message: 'No tienes permiso para consultar los estudiantes de esta empresa.' });
      }
    }

    const students = await ProfessionalPractice.getStudentsByCompanyID(companyID);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes para esta institución.' });
    }

    res.status(200).json(students);

  } catch (error) {
    console.error('Error al obtener estudiantes por institución:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar información de una práctica profesional
exports.patchPractice = async (req, res) => {
  try {
    const { practiceID } = req.params;
    const updateData = req.body;

    // Validar campos
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    // Validar existencia de la práctica
    const practice = await ProfessionalPractice.getPracticeByID(practiceID);
    if (!practice) {
      return res.status(404).json({ message: 'La práctica profesional no existe.' });
    }

    // Actualizar
    const result = await ProfessionalPractice.patchPractice(practiceID, updateData);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error al actualizar práctica:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar la práctica profesional', error: error.message });
  }
};

// Eliminar lógicamente una práctica profesional
exports.deletePractice = async (req, res) => {
  try {
    const { practiceID } = req.params;

    // Verificar que la práctica exista
    const practice = await ProfessionalPractice.getPracticeByID(practiceID);
    if (!practice) {
      return res.status(404).json({ message: 'La práctica profesional no existe.' });
    }

    // Realizar eliminación lógica
    const result = await ProfessionalPractice.deletePractice(practiceID);
    res.status(200).json({ message: 'Práctica eliminada correctamente', result });

  } catch (error) {
    console.error('Error al eliminar práctica:', error.message);
    res.status(500).json({ message: 'No se pudo eliminar la práctica profesional', error: error.message });
  }
};
