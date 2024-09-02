const DocumentoAlumno = require('../models/documentoAlumno');

// Obtener documentos por alumno y estatus
exports.obtenerDocumentosPorAlumnoYEstado = async (req, res) => {
    try {
        const { alumnoID } = req.params;
        const { estatus } = req.query;  // Puede ser "En proceso" o "Aceptado"
        const documentos = await DocumentoAlumno.obtenerDocumentosPorAlumnoYEstado(alumnoID, estatus);
        res.status(200).send(documentos);
    } catch (err) {
        res.status(500).send({ message: 'Error en el servidor: ' + err.message });
    }
};

// Obtener un documento por ID
exports.obtenerDocumentoPorID = async (req, res) => {
    try {
        const { id } = req.params;
        const documento = await DocumentoAlumno.obtenerDocumentoPorID(id);

        if (documento) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${documento.nombreArchivo}"`);
            res.send(Buffer.from(documento.archivo, 'binary'));
        } else {
            res.status(404).send({ message: 'Documento no encontrado' });
        }
    } catch (err) {
        res.status(500).send({ message: 'Error en el servidor: ' + err.message });
    }
};

// Contar documentos aceptados de un alumno
exports.contarDocumentosAceptados = async (req, res) => {
    try {
        const { alumnoID } = req.params;
        const count = await DocumentoAlumno.contarDocumentosAceptados(alumnoID);
        res.status(200).json(count);
    } catch (err) {
        res.status(500).json({ message: 'Error al contar los documentos aceptados', error: err.message });
    }
};

// Aprobar un documento
exports.aprobarDocumento = async (req, res) => {
    try {
        const { documentId, userType } = req.body;
        const result = await DocumentoAlumno.aprobarDocumento(documentId, userType);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error approving document', error: err.message });
    }
};

// Rechazar un documento
exports.rechazarDocumento = async (req, res) => {
    try {
        const { documentId, userType } = req.body;
        const result = await DocumentoAlumno.rechazarDocumento(documentId, userType);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error rejecting document', error: err.message });
    }
};

// Eliminar un documento
exports.eliminarDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await DocumentoAlumno.eliminarDocumento(id);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send({ message: 'Error en el servidor: ' + err.message });
    }
};
