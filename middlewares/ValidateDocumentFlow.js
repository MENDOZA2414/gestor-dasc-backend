const pool = require('../config/db');
const StudentDocumentation = require('../models/StudentDocumentation');
const { FLOW_ORDER, VALID_DOCUMENT_TYPES } = require('../utils/documentTypes');

const validateDocumentFlow = async (req, res, next) => {
  try {
    const { documentID } = req.params;
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (userTypeID !== 2) {
      return res.status(403).json({ message: 'Solo los estudiantes pueden enviar documentos a revisión' });
    }

    const document = await StudentDocumentation.getDocumentByID(documentID);
    if (!document || document.status !== 'Pendiente') {
      return res.status(400).json({ message: 'El documento no está en estado Pendiente o no existe.' });
    }

    // Obtener studentID real
    const [[studentRow]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [requesterID]
    );

    if (!studentRow) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const studentID = studentRow.studentID;

    if (document.studentID !== studentID) {
      return res.status(403).json({ message: 'No puedes modificar un documento que no te pertenece.' });
    }

    const docType = document.documentType;

    if (!VALID_DOCUMENT_TYPES.includes(docType)) {
      return res.status(400).json({ message: 'Tipo de documento no válido.' });
    }

    const hasAccepted = async (type) => {
      const [rows] = await pool.query(`
        SELECT 1 FROM StudentDocumentation 
        WHERE studentID = ? AND documentType = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
      `, [studentID, type]);
      return rows.length > 0;
    };

    // Validaciones de flujo específicas
    const [acceptedDocs] = await pool.query(`
      SELECT documentType FROM StudentDocumentation 
      WHERE studentID = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
    `, [studentID]);

    const acceptedTypes = acceptedDocs.map(d => d.documentType);

    // Verificar si ya completó todos los documentos
    const allCompleted = FLOW_ORDER.every(doc => acceptedTypes.includes(doc));
    if (allCompleted) {
      return res.status(400).json({
        message: 'Ya has completado todos los documentos requeridos. No necesitas enviar más.'
      });
    }

    // Validar que está enviando el documento que le corresponde
    const nextRequired = FLOW_ORDER.find(doc => !acceptedTypes.includes(doc));
    if (docType !== nextRequired) {
      return res.status(400).json({
        message: `Aún no puedes enviar este documento. Primero debes enviar y aprobar: ${nextRequired}`
      });
    }

    // Validación especial para CartaAceptacion
    if (docType === 'CartaAceptacion') {
      const presentacionOk = await hasAccepted('CartaPresentacion');

      const [[postulacion]] = await pool.query(`
        SELECT 1 FROM StudentApplication 
        WHERE studentID = ? AND status = 'PreAceptado' AND recordStatus = 'Activo'
        LIMIT 1
      `, [studentID]);

      if (!presentacionOk || !postulacion) {
        return res.status(400).json({
          message: 'Debes tener la Carta de Presentación aceptada y una postulación preaceptada para enviar la Carta de Aceptación.'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Error en la validación de flujo de documentos:', error.message);
    res.status(500).json({ message: 'Error interno de validación de flujo', error: error.message });
  }
};

module.exports = validateDocumentFlow;
