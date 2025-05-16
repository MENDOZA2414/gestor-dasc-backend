const StudentDocumentation = require('../models/StudentDocumentation');

// Obtener documentos por alumno y estatus
exports.getDocumentsByStudentAndStatus = async (req, res) => {
    try {
        const { studentID } = req.params;
        const { status } = req.query;  // Puede ser "Pending", "Accepted", "Rejected"
        const documents = await StudentDocumentation.getDocumentsByStudentAndStatus(studentID, status);
        res.status(200).send(documents);
    } catch (err) {
        res.status(500).send({ message: 'Error en el servidor: ' + err.message });
    }
};

// Obtener un documento por ID
exports.getDocumentByID = async (req, res) => {
    try {
      const { id } = req.params;
      const document = await StudentDocumentation.getDocumentByID(id);
  
      if (document) {
        res.status(200).json({
          filePath: document.filePath,
          fileName: document.fileName
        });
      } else {
        res.status(404).send({ message: 'Documento no encontrado' });
      }
    } catch (err) {
      res.status(500).send({ message: 'Error en el servidor: ' + err.message });
    }
};

// Contar documentos aceptados de un alumno
exports.countAcceptedDocuments = async (req, res) => {
    try {
        const { studentID } = req.params;
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
  
      // Obtener info del documento
      const doc = await StudentDocumentation.getDocumentByID(documentID);
      if (!doc) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }
  
      const result = await StudentDocumentation.approveDocument(
        documentID,
        doc.fileName,
        doc.filePath
      );
  
      res.status(200).send(result);
    } catch (err) {
      res.status(500).send({ message: 'Error al aprobar documento', error: err.message });
    }
  };
  

// Rechazar un documento
exports.rejectDocument = async (req, res) => {
    try {
        const { documentID } = req.body;
        const userType = req.user.userTypeID;
        const result = await StudentDocumentation.rejectDocument(documentID, userType);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error al rechazar documento', error: err.message });
    }
};

// Marcar un documento como en revisión
exports.markDocumentAsInReview = async (req, res) => {
  try {
    const { documentID } = req.params;
    const userType = req.user.userTypeID;

    if (userType !== 'student' && userType !== 2)  {
      return res.status(403).json({ message: 'Solo los estudiantes pueden enviar documentos a revisión' });
    }

    const document = await StudentDocumentation.getDocumentByID(documentID);

    if (!document || document.status !== 'Pendiente') {
      return res.status(400).json({ message: 'El documento no está en estado Pendiente o no existe' });
    }
    // Obtener ruta interna desde filePath
    const ftpPath = document.filePath.replace('https://uabcs.online/practicas', '');

    const result = await StudentDocumentation.markAsInReview(
      documentID,
      document.fileName,
      ftpPath
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
        const { documentID } = req.body;
        const userType = req.user.userTypeID;
        const result = await StudentDocumentation.deleteDocument(documentID, userType);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error al eliminar documento', error: err.message });
    }
};

// Actualizar metadatos de un documento (documentType, fileName, status, etc.)
exports.patchDocument = async (req, res) => {
    try {
        const { documentID } = req.params;
        const updateData = req.body;
        const result = await StudentDocumentation.patchDocument(documentID, updateData);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error al actualizar documento', error: err.message });
    }
};
