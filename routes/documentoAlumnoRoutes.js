const express = require('express');
const router = express.Router();
const documentoAlumnoController = require('../controllers/documentoAlumnoController');

// Obtener documentos por alumno y estatus
router.get('/documentoAlumno/:alumnoID', documentoAlumnoController.obtenerDocumentosPorAlumnoYEstado);

// Obtener un documento por ID
router.get('/documentoAlumno/:id', documentoAlumnoController.obtenerDocumentoPorID);

// Contar documentos aceptados de un alumno
router.get('/countAcceptedDocuments/:alumnoID', documentoAlumnoController.contarDocumentosAceptados);

// Aprobar un documento
router.post('/documentoAlumno/approve', documentoAlumnoController.aprobarDocumento);

// Rechazar un documento
router.post('/documentoAlumno/reject', documentoAlumnoController.rechazarDocumento);

// Eliminar un documento
router.delete('/documentoAlumno/:id', documentoAlumnoController.eliminarDocumento);

module.exports = router;
