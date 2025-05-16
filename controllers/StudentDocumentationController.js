const pool = require('../config/db');
const StudentDocumentation = require('../models/StudentDocumentation');

// Obtener documentos por estudiante y estatus
exports.getDocumentsByStudentAndStatus = async (req, res) => {
  try {
    const { studentID } = req.params;
    const { status } = req.query;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles del usuario autenticado
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Bloquear acceso a empresas
    if (userTypeID === 4) {
      return res.status(403).json({
        message: 'Las empresas no tienen acceso a los documentos del estudiante.'
      });
    }

    // Si no es admin, validar por tipo
    if (!isAdmin) {
      if (userTypeID === 2 && parseInt(studentID) !== requesterID) {
        return res.status(403).json({
          message: 'No puedes acceder a los documentos de otro estudiante.'
        });
      }

      if (userTypeID === 1) {
        const [students] = await pool.query(
          `SELECT internalAssessorID FROM Student WHERE userID = ?`,
          [studentID]
        );

        const assignedAssessorID = students[0]?.internalAssessorID;
        if (assignedAssessorID !== requesterID) {
          return res.status(403).json({
            message: 'No puedes acceder a documentos de un alumno no asignado a ti.'
          });
        }
      }

      // Si en el futuro se DECIDE permitir algo al asesor externo, se agrega aquí TODO
    }

    const documents = await StudentDocumentation.getDocumentsByStudentAndStatus(studentID, status);
    res.status(200).send(documents);

  } catch (err) {
    console.error('Error al obtener documentos del alumno:', err.message);
    res.status(500).send({ message: 'Error en el servidor: ' + err.message });
  }
};

// Obtener un documento por ID
exports.getDocumentByID = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const document = await StudentDocumentation.getDocumentByID(id);

    if (!document) {
      return res.status(404).send({ message: 'Documento no encontrado' });
    }

    // Obtener roles
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Bloquear acceso a empresas
    if (userTypeID === 4) {
      return res.status(403).json({ message: 'Las empresas no pueden acceder a documentos.' });
    }

    // Si no es admin, validar restricciones
    if (!isAdmin) {
      if (userTypeID === 2 && document.studentID !== requesterID) {
        return res.status(403).json({ message: 'No puedes acceder a documentos de otro estudiante.' });
      }

      if (userTypeID === 1) {
        const [studentRow] = await pool.query(
          `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
          [document.studentID]
        );

        const assignedAssessorID = studentRow[0]?.internalAssessorID;
        if (assignedAssessorID !== requesterID) {
          return res.status(403).json({ message: 'No puedes acceder a documentos de un alumno no asignado a ti.' });
        }
      }
    }

    res.status(200).json({
      filePath: document.filePath,
      fileName: document.fileName
    });

  } catch (err) {
    res.status(500).send({ message: 'Error en el servidor: ' + err.message });
  }
};

// Contar documentos aceptados de un alumno
exports.countAcceptedDocuments = async (req, res) => {
  try {
    const { studentID } = req.params;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Bloquear empresas
    if (userTypeID === 4) {
      return res.status(403).json({ message: 'No autorizado para ver esta información.' });
    }

    // Si no es admin, aplicar restricciones por tipo
    if (!isAdmin) {
      if (userTypeID === 2 && parseInt(studentID) !== requesterID) {
        return res.status(403).json({ message: 'No puedes consultar documentos de otro alumno.' });
      }

      if (userTypeID === 1) {
        const [students] = await pool.query(
          `SELECT internalAssessorID FROM Student WHERE userID = ?`,
          [studentID]
        );

        const assignedAssessorID = students[0]?.internalAssessorID;
        if (assignedAssessorID !== requesterID) {
          return res.status(403).json({ message: 'No puedes consultar documentos de un alumno no asignado a ti.' });
        }
      }
    }

    const count = await StudentDocumentation.countAcceptedDocuments(studentID);
    res.status(200).json(count);

  } catch (err) {
    res.status(500).json({ message: 'Error al contar los documentos aceptados', error: err.message });
  }
};

// Aprobar un documento
exports.approveDocument = async (req, res) => {
  try {
    const { documentID } = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!documentID) {
      return res.status(400).json({ message: 'Falta el documentID en el body' });
    }

    const doc = await StudentDocumentation.getDocumentByID(documentID);

    if (!doc) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    if (doc.status !== 'EnRevision') {
      return res.status(400).json({ message: 'Solo se pueden aprobar documentos en estado EnRevisión' });
    }

    // Obtener roles del usuario
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Bloquear usuarios no autorizados
    if (userTypeID !== 1 && !isAdmin) {
      return res.status(403).json({ message: 'Solo asesores internos o administradores pueden aprobar documentos.' });
    }

    // Si es asesor interno, validar asignación del alumno
    if (userTypeID === 1 && !isAdmin) {
      const [students] = await pool.query(
        `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
        [doc.studentID]
      );

      const assignedAssessorID = students[0]?.internalAssessorID;
      if (assignedAssessorID !== requesterID) {
        return res.status(403).json({ message: 'No puedes aprobar documentos de un alumno no asignado a ti.' });
      }
    }

    // Aprobar el documento
    const result = await StudentDocumentation.approveDocument(
      documentID,
      doc.fileName,
      doc.filePath
    );

    res.status(200).send(result);

  } catch (err) {
    console.error('Error al aprobar documento:', err.message);
    res.status(500).send({ message: 'Error al aprobar documento', error: err.message });
  }
};

// Rechazar un documento
exports.rejectDocument = async (req, res) => {
  try {
    const { documentID } = req.body;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!documentID) {
      return res.status(400).json({ message: 'Falta el documentID en el body' });
    }

    const doc = await StudentDocumentation.getDocumentByID(documentID);

    if (!doc) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    if (doc.status !== 'EnRevision') {
      return res.status(400).json({ message: 'Solo se pueden rechazar documentos en estado EnRevisión' });
    }

    // Obtener roles del usuario
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Bloquear si no es asesor interno ni admin
    if (userTypeID !== 1 && !isAdmin) {
      return res.status(403).json({ message: 'Solo asesores internos o administradores pueden rechazar documentos.' });
    }

    // Si es asesor interno, validar que el alumno esté asignado a él
    if (userTypeID === 1 && !isAdmin) {
      const [students] = await pool.query(
        `SELECT internalAssessorID FROM Student WHERE studentID = ?`,
        [doc.studentID]
      );

      const assignedAssessorID = students[0]?.internalAssessorID;
      if (assignedAssessorID !== requesterID) {
        return res.status(403).json({ message: 'No puedes rechazar documentos de un alumno no asignado a ti.' });
      }
    }

    // Ejecutar el rechazo
    const result = await StudentDocumentation.rejectDocument(
      documentID,
      doc.fileName,
      doc.filePath
    );

    res.status(200).send(result);

  } catch (err) {
    console.error('Error al rechazar documento:', err.message);
    res.status(500).send({ message: 'Error al rechazar documento', error: err.message });
  }
};

// Marcar un documento como en revisión
exports.markDocumentAsInReview = async (req, res) => {
  try {
    const { documentID } = req.params;
    const requesterID = req.user.id;
    const userType = req.user.userTypeID;

    // Validar tipo de usuario
    if (userType !== 2) {
      return res.status(403).json({ message: 'Solo los estudiantes pueden enviar documentos a revisión' });
    }

    // Obtener documento
    const document = await StudentDocumentation.getDocumentByID(documentID);

    if (!document || document.status !== 'Pendiente') {
      return res.status(400).json({ message: 'El documento no está en estado Pendiente o no existe' });
    }

    // Validar que el documento pertenezca al estudiante autenticado
    if (document.studentID !== requesterID) {
      return res.status(403).json({ message: 'No puedes modificar un documento que no te pertenece.' });
    }

    // Marcar como EnRevision
    const result = await StudentDocumentation.markAsInReview(
      documentID,
      document.fileName,
      document.filePath
    );

    res.status(200).json(result);

  } catch (error) {
    console.error('Error al marcar documento en revisión:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Eliminar un documento
exports.deleteDocument = async (req, res) => {
  try {
    const { documentID } = req.params;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (!documentID) {
      return res.status(400).json({ message: 'Falta el documentID en la URL' });
    }

    // Solo estudiantes pueden eliminar documentos
    if (userTypeID !== 2) {
      return res.status(403).json({ message: 'Solo los estudiantes pueden eliminar documentos.' });
    }

    // Obtener información actual del documento
    const document = await StudentDocumentation.getDocumentByID(documentID);

    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Verificar propiedad del documento
    if (document.studentID !== requesterID) {
      return res.status(403).json({ message: 'No puedes eliminar un documento que no te pertenece.' });
    }

    // Verificar estado del documento
    if (document.status !== 'Pendiente' && document.status !== 'Rechazado') {
      return res.status(400).json({
        message: 'Solo puedes eliminar documentos que están en estado Pendiente o Rechazado.'
      });
    }

    // Ejecutar eliminación lógica y renombrado en FTP
    const result = await StudentDocumentation.deleteDocument(
      documentID,
      document.fileName,
      document.filePath
    );

    res.status(200).send(result);

  } catch (err) {
    console.error("Error en deleteDocument:", err.message);
    res.status(500).send({ message: 'Error al eliminar documento', error: err.message });
  }
};

// Actualizar metadatos de un documento (documentType, fileName, status, etc.)
exports.patchDocument = async (req, res) => {
  try {
    const { documentID } = req.params;
    const updateData = req.body;

    // Verificar que el documento exista
    const existingDoc = await StudentDocumentation.getDocumentByID(documentID);
    if (!existingDoc) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Ejecutar la actualización
    const result = await StudentDocumentation.patchDocument(documentID, updateData);
    res.status(200).send(result);

  } catch (err) {
    res.status(500).send({ message: 'Error al actualizar documento', error: err.message });
  }
};