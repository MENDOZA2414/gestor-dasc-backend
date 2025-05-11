const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const studentDocumentationController = require('../controllers/StudentDocumentationController');

// Obtener documentos por estudiante y estatus
router.get('/student/:studentID', studentDocumentationController.getDocumentsByStudentAndStatus);

// Obtener un documento por ID
router.get('/document/:id', studentDocumentationController.getDocumentByID);

// Contar documentos aceptados de un estudiante
router.get('/countAcceptedDocuments/:studentID', studentDocumentationController.countAcceptedDocuments);

// Aprobar un documento
router.post('/approve', authMiddleware, studentDocumentationController.approveDocument);

// Rechazar un documento
router.post('/reject', authMiddleware, studentDocumentationController.rejectDocument);

// Eliminar un documento (eliminación lógica + renombrar en FTP)
router.delete('/:documentID', authMiddleware, studentDocumentationController.deleteDocument);

module.exports = router;
