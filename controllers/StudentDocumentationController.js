const StudentDocumentation = require('../models/StudentDocumentation');

// Obtener documentos por alumno y estatus
exports.getDocumentsByStudentAndStatus = async (req, res) => {
    try {
        const { studentID } = req.params;
        const { status } = req.query;  // Puede ser "En proceso" o "Aceptado"
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
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
            res.send(Buffer.from(document.file, 'binary'));
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
      const userType = req.user.userTypeID;
      const result = await StudentDocumentation.approveDocument(documentID, userType);
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
  
  
