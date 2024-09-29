const express = require('express');
const router = express.Router();
const studentDocumentationController = require('../controllers/StudentDocumentationController');

// Obtener documentos por estudiante y estatus
router.get('/:studentID', studentDocumentationController.getDocumentsByStudentAndStatus);

// Obtener un documento por ID
router.get('/:id', studentDocumentationController.getDocumentByID);

// Contar documentos aceptados de un estudiante
router.get('/countAcceptedDocuments/:studentID', studentDocumentationController.countAcceptedDocuments);

// Aprobar un documento
router.post('/approve', studentDocumentationController.approveDocument);

// Rechazar un documento
router.post('/reject', studentDocumentationController.rejectDocument);

// Eliminar un documento
router.delete('/:id', studentDocumentationController.deleteDocument);

module.exports = router;
