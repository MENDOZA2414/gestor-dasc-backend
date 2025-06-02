const pool = require('../config/db');
const StudentDocumentation = require('../models/StudentDocumentation');
const { FLOW_ORDER } = require('../utils/documentTypes');

const validateDocumentApproval = async (req, res, next) => {
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

    // Obtener roles
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');
    req.user.roleLabel = isAdmin ? 'admin' : 'internalAssessor';

    // Validación de permisos
    if (userTypeID !== 1 && !isAdmin) {
      return res.status(403).json({ message: 'Solo asesores internos o administradores pueden aprobar documentos.' });
    }

    // Si es asesor, validar asignación
    if (userTypeID === 1 && !isAdmin) {
      const [[assessorRow]] = await pool.query(
        'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
        [requesterID]
      );

      if (!assessorRow) {
        return res.status(404).json({ message: 'Asesor interno no encontrado' });
      }

      const internalAssessorID = assessorRow.internalAssessorID;

      const [students] = await pool.query(`
        SELECT internalAssessorID FROM Student WHERE studentID = ?
      `, [doc.studentID]);

      const assignedAssessorID = students[0]?.internalAssessorID;
      if (assignedAssessorID !== internalAssessorID) {
        return res.status(403).json({ message: 'No puedes aprobar documentos de un alumno no asignado a ti.' });
      }
    }

    // Validar que todos los documentos anteriores estén aceptados
    const currentIndex = FLOW_ORDER.indexOf(doc.documentType);
    const previousRequired = FLOW_ORDER.slice(0, currentIndex);

    if (previousRequired.length > 0) {
      const [completedDocs] = await pool.query(`
        SELECT documentType FROM StudentDocumentation
        WHERE studentID = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
      `, [doc.studentID]);

      const acceptedDocs = completedDocs.map(d => d.documentType);
      const missing = previousRequired.filter(reqType => !acceptedDocs.includes(reqType));

      if (missing.length > 0) {
        return res.status(400).json({
          message: `No puedes aprobar este documento hasta que estén aceptados los anteriores: ${missing.join(', ')}.`
        });
      }
    }

    // Todo listo
    req.document = doc;
    next();

  } catch (err) {
    console.error('Error en validación de aprobación:', err.message);
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
};

module.exports = validateDocumentApproval;
