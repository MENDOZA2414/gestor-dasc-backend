const ProfessionalPractice = require('../models/ProfessionalPractice');
const getUserRoles = require('../utils/GetUserRoles');
const pool  = require("../config/db");

// Obtener la práctica profesional registrada de un estudiante autenticado
exports.getPracticeByLoggedStudent = async (req, res) => {
  try {
    const userID = req.user.id;

    // Buscar el studentID real
    const [[studentRow]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );

    if (!studentRow) {
      return res.status(404).json({ message: 'No se encontró información del estudiante autenticado.' });
    }

    const studentID = studentRow.studentID;

    const practice = await ProfessionalPractice.getPracticeByStudentID(studentID);

    if (!practice) {
      return res.status(404).json({ message: 'No tienes una práctica profesional registrada.' });
    }

    res.status(200).json(practice);

  } catch (error) {
    console.error('Error al obtener la práctica del alumno autenticado:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener la práctica profesional registrada de un estudiante
exports.getPracticeByStudentID = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const studentID = parseInt(req.params.studentID);

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, aplicar restricciones
    if (!isAdmin) {
      // Si es estudiante, solo puede consultar su propia práctica
      if (userTypeID === 2 && requesterID !== studentID) {
        return res.status(403).json({ message: 'No puedes ver prácticas de otro estudiante.' });
      }

      // Si es asesor interno, debe estar asignado al estudiante
      if (userTypeID === 1) {
        // Obtener internalAssessorID real del asesor autenticado
        const [[assessorRow]] = await pool.query(
          'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );

        const internalAssessorIDReal = assessorRow?.internalAssessorID;

        // Obtener el asesor asignado al alumno
        const [studentData] = await pool.query(
          `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
          [studentID]
        );

        const assignedAssessorID = studentData[0]?.internalAssessorID;

        if (internalAssessorIDReal !== assignedAssessorID) {
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
    const companyIDParam = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      // Obtener companyID real del usuario autenticado
      const [[companyRow]] = await pool.query(
        'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      const companyIDReal = companyRow?.companyID;

      if (!companyIDReal || companyIDReal !== companyIDParam) {
        return res.status(403).json({ message: 'No tienes permiso para consultar prácticas de otra empresa.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByCompanyID(companyIDParam);

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
    const externalAssessorIDParam = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID === 3) { // Asesor externo
        // Obtener su propio externalAssessorID
        const [[assessorRow]] = await pool.query(
          'SELECT externalAssessorID FROM ExternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );
        const externalAssessorIDReal = assessorRow?.externalAssessorID;

        if (externalAssessorIDReal !== externalAssessorIDParam) {
          return res.status(403).json({ message: 'No puedes consultar prácticas de otro asesor.' });
        }

      } else if (userTypeID === 4) { // Empresa
        // Obtener companyID de la empresa autenticada
        const [[companyRow]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );
        const companyID = companyRow?.companyID;

        // Verificar si el asesor pertenece a esa empresa
        const [[assessorRow]] = await pool.query(
          'SELECT companyID FROM ExternalAssessor WHERE externalAssessorID = ? AND recordStatus = "Activo"',
          [externalAssessorIDParam]
        );

        if (!assessorRow || assessorRow.companyID !== companyID) {
          return res.status(403).json({ message: 'No puedes consultar prácticas de un asesor externo que no pertenece a tu empresa.' });
        }

      } else {
        return res.status(403).json({ message: 'No tienes permiso para consultar estas prácticas.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByExternalAssessorID(externalAssessorIDParam);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas para este asesor externo.' });
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
    const internalAssessorIDParam = parseInt(req.params.internalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID !== 1) {
        return res.status(403).json({ message: 'No tienes permiso para consultar estas prácticas.' });
      }

      // Obtener el internalAssessorID real del asesor autenticado
      const [[assessorRow]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      const internalAssessorIDReal = assessorRow?.internalAssessorID;

      if (internalAssessorIDReal !== internalAssessorIDParam) {
        return res.status(403).json({ message: 'No puedes consultar prácticas de otro asesor interno.' });
      }
    }

    const practices = await ProfessionalPractice.getPracticesByInternalAssessorID(internalAssessorIDParam);

    if (!practices || practices.length === 0) {
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
    const internalAssessorIDParam = parseInt(req.params.internalAssessorID);
    const studentID = parseInt(req.params.studentID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID !== 1) {
        return res.status(403).json({ message: 'No tienes permiso para consultar esta práctica.' });
      }

      // Obtener el internalAssessorID real del usuario autenticado
      const [[assessorRow]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      const internalAssessorIDReal = assessorRow?.internalAssessorID;

      // Comparar con el de la ruta
      if (internalAssessorIDReal !== internalAssessorIDParam) {
        return res.status(403).json({ message: 'No puedes consultar prácticas de otro asesor.' });
      }

      // Verificar que el alumno esté asignado a él
      const [[studentRow]] = await pool.query(
        'SELECT internalAssessorID FROM Student WHERE studentID = ?',
        [studentID]
      );

      if (studentRow?.internalAssessorID !== internalAssessorIDReal) {
        return res.status(403).json({ message: 'Este alumno no está asignado a ti.' });
      }
    }

    const practice = await ProfessionalPractice.getStudentPracticeByAssessor(internalAssessorIDParam, studentID);

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
    const roles = await getUserRoles(requesterID);

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
    const externalAssessorIDParam = parseInt(req.params.externalAssessorID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID === 3) {
        // Asesor externo autenticado: validar que el ID coincida
        const [[assessorRow]] = await pool.query(
          'SELECT externalAssessorID FROM ExternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );
        const realExternalAssessorID = assessorRow?.externalAssessorID;
        if (realExternalAssessorID !== externalAssessorIDParam) {
          return res.status(403).json({ message: 'No puedes consultar estudiantes de otro asesor externo.' });
        }

      } else if (userTypeID === 4) {
        // Empresa autenticada: validar que ese asesor externo pertenezca a esta empresa
        const [[assessorRow]] = await pool.query(
          'SELECT companyID FROM ExternalAssessor WHERE externalAssessorID = ? AND recordStatus = "Activo"',
          [externalAssessorIDParam]
        );

        const assessorCompanyID = assessorRow?.companyID;

        const [[companyRow]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );

        const requesterCompanyID = companyRow?.companyID;

        if (assessorCompanyID !== requesterCompanyID) {
          return res.status(403).json({ message: 'Este asesor externo no pertenece a tu empresa.' });
        }

      } else {
        return res.status(403).json({ message: 'No tienes permiso para consultar estos estudiantes.' });
      }
    }

    const students = await ProfessionalPractice.getStudentsByExternalAssessorID(externalAssessorIDParam);

    if (!students || students.length === 0) {
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
    const companyIDParam = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID !== 4) {
        return res.status(403).json({ message: 'No tienes permiso para consultar los estudiantes de esta empresa.' });
      }

      // Obtener el companyID real del usuario autenticado
      const [[companyRow]] = await pool.query(
        'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      const requesterCompanyID = companyRow?.companyID;

      if (requesterCompanyID !== companyIDParam) {
        return res.status(403).json({ message: 'No puedes consultar estudiantes de otra empresa.' });
      }
    }

    const students = await ProfessionalPractice.getStudentsByCompanyID(companyIDParam);

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes para esta empresa.' });
    }

    res.status(200).json(students);

  } catch (error) {
    console.error('Error al obtener estudiantes por empresa:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener estadísticas de prácticas por carrera
exports.getTopCompaniesStats = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Solo administradores pueden acceder a esta información.' });
    }

    const result = await ProfessionalPractice.getTopCompaniesByStudentCount();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener el top de entidades:", error.message);
    res.status(500).json({ message: "No se pudo obtener la estadística", error: error.message });
  }
};

// Actualizar información de una práctica profesional
exports.patchPractice = async (req, res) => {
  try {
    const practiceID = parseInt(req.params.practiceID);
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    const practice = await ProfessionalPractice.getPracticeByID(practiceID);
    if (!practice) {
      return res.status(404).json({ message: 'La práctica profesional no existe.' });
    }

    // Lista de campos permitidos para actualizar
    const allowedFields = ['startDate', 'endDate', 'status', 'progressStep', 'observations'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (field in updateData) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    const result = await ProfessionalPractice.patchPractice(practiceID, filteredData);
    res.status(200).json({ message: 'Práctica actualizada exitosamente', result });

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

// Actualizar el estado de una práctica profesional
exports.updatePracticeStatus = async (req, res) => {
  try {
    const { practiceID } = req.params;
    const { status } = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Validar estado nuevo
    const validStatuses = ['Started', 'Finished', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Estado no válido. Usa uno de: ${validStatuses.join(', ')}` });
    }

    // Verificar existencia de la práctica
    const practice = await ProfessionalPractice.getPracticeByID(practiceID);
    if (!practice) {
      return res.status(404).json({ message: 'La práctica profesional no existe.' });
    }

    // Obtener roles y validar permisos
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID !== 1) {
        return res.status(403).json({ message: 'No tienes permisos para modificar esta práctica.' });
      }

      // Obtener el internalAssessorID real del usuario autenticado
      const [[authAssessor]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );
      const internalAssessorIDReal = authAssessor?.internalAssessorID;

      // Validar si ese asesor está asignado al alumno de la práctica
      const [[data]] = await pool.query(`
        SELECT s.internalAssessorID
        FROM ProfessionalPractice pp
        JOIN Student s ON pp.studentID = s.studentID
        WHERE pp.practiceID = ?
      `, [practiceID]);

      if (!data || data.internalAssessorID !== internalAssessorIDReal) {
        return res.status(403).json({ message: 'Solo puedes modificar prácticas de tus propios alumnos.' });
      }
    }

    // Actualizar estado
    const result = await ProfessionalPractice.patchPractice(practiceID, { status });
    res.status(200).json({ message: 'Estado actualizado correctamente', result });

  } catch (error) {
    console.error('Error al actualizar estado de práctica:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar el estado de la práctica', error: error.message });
  }
};

// Actualizar el progreso de una práctica profesional
exports.updatePracticeProgress = async (req, res) => {
  try {
    const { practiceID } = req.params;
    const { progressStep } = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Validar el valor recibido
    if (progressStep === undefined || isNaN(progressStep) || ![0, 1, 2, 3, 4].includes(Number(progressStep))) {
      return res.status(400).json({ message: 'El progreso debe ser un número entre 0 y 4.' });
    }

    // Verificar que la práctica exista
    const practice = await ProfessionalPractice.getPracticeByID(practiceID);
    if (!practice) {
      return res.status(404).json({ message: 'La práctica profesional no existe.' });
    }

    // Obtener roles y validar acceso
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID !== 1) {
        return res.status(403).json({ message: 'No tienes permisos para modificar esta práctica.' });
      }

      const [[authAssessor]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );
      const internalAssessorIDReal = authAssessor?.internalAssessorID;

      const [[data]] = await pool.query(`
        SELECT s.internalAssessorID
        FROM ProfessionalPractice pp
        JOIN Student s ON pp.studentID = s.studentID
        WHERE pp.practiceID = ?
      `, [practiceID]);

      if (!data || data.internalAssessorID !== internalAssessorIDReal) {
        return res.status(403).json({ message: 'Solo puedes modificar prácticas de tus propios alumnos.' });
      }
    }

    // Actualizar progreso
    const result = await ProfessionalPractice.updatePracticeProgress(practiceID, progressStep);
    res.status(200).json({ message: 'Progreso actualizado correctamente', result });

  } catch (error) {
    console.error('Error al actualizar progreso de práctica:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar el progreso', error: error.message });
  }
};

const progressLabels = {
  0: 'No iniciado',
  1: 'Reporte I aprobado',
  2: 'Reporte II aprobado',
  3: 'Reporte Final aprobado',
  4: 'Práctica finalizada'
};

exports.getPracticeProgress = async (req, res) => {
  try {
    const studentID = parseInt(req.params.studentID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Obtener práctica activa
    const practice = await ProfessionalPractice.getPracticeByStudentID(studentID);
    if (!practice) {
      return res.status(404).json({ message: 'No se encontró práctica para este alumno.' });
    }

    // Permitir si es admin
    if (!isAdmin) {
      let authorized = false;

      if (userTypeID === 0 && req.user.userID === practice.studentID) {
        authorized = true;
      }

      if (userTypeID === 1) {
        // Asesor interno: verificar asignación
        const [[assessor]] = await pool.query(
          'SELECT internalAssessorID FROM Student WHERE studentID = ?',
          [studentID]
        );
        if (assessor?.internalAssessorID) {
          const [[authAssessor]] = await pool.query(
            'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
            [requesterID]
          );
          if (authAssessor?.internalAssessorID === assessor.internalAssessorID) {
            authorized = true;
          }
        }
      }

      if (userTypeID === 3) {
        // Asesor externo: verificar si está asignado a esa práctica
        const [[authExternal]] = await pool.query(
          'SELECT externalAssessorID FROM ExternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );
        if (authExternal?.externalAssessorID === practice.externalAssessorID) {
          authorized = true;
        }
      }

      if (userTypeID === 4) {
        // Empresa: verificar si es la empresa de esa práctica
        const [[authCompany]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );
        if (authCompany?.companyID === practice.companyID) {
          authorized = true;
        }
      }

      if (!authorized) {
        return res.status(403).json({ message: 'No tienes permiso para ver el progreso de esta práctica.' });
      }
    }

    const step = practice.progressStep ?? 0;

    res.status(200).json({
      progressStep: step,
      progressLabel: progressLabels[step] || 'Desconocido'
    });

  } catch (error) {
    console.error('Error al consultar progreso:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getMyPracticeProgress = async (req, res) => {
  try {
    const [[studentRow]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [req.user.id]
    );

    const studentID = studentRow?.studentID;

    if (!studentID) {
      return res.status(404).json({ message: 'No se encontró el alumno autenticado en la base de datos.' });
    }

    const practice = await ProfessionalPractice.getPracticeByStudentID(studentID);
    if (!practice) {
      return res.status(404).json({ message: 'No se encontró práctica para este alumno.' });
    }

    const step = practice.progressStep ?? 0;
    const progressLabels = {
      0: 'No iniciado',
      1: 'Reporte I aprobado',
      2: 'Reporte II aprobado',
      3: 'Reporte Final aprobado',
      4: 'Práctica finalizada'
    };

    res.status(200).json({
      progressStep: step,
      progressLabel: progressLabels[step]
    });

  } catch (error) {
    console.error('Error al consultar progreso (me):', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};
