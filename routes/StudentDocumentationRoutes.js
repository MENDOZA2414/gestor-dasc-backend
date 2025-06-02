const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const studentDocumentationController = require('../controllers/StudentDocumentationController');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const validateDocumentFlow = require('../middlewares/ValidateDocumentFlow');
const validateDocumentApproval = require('../middlewares/ValidateDocumentApproval');

// Obtener documentos por estudiante y estatus
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.getDocumentsByStudentAndStatus
);

// Obtener un documento por ID
router.get(
  '/document/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.getDocumentByID
);

// Contar documentos aceptados de un estudiante
router.get(
  '/count-accepted/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.countAcceptedDocuments
);

// Aprobar un documento
router.patch(
  '/approve',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  validateDocumentApproval,
  studentDocumentationController.approveDocument
);

// Rechazar un documento
router.post(
  '/reject',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['internalAssessor']),
  studentDocumentationController.rejectDocument
);

// Marcar un documento como en revisión
router.patch(
  '/review/:documentID',
  authMiddleware,
  checkUserType(['student']),
  validateDocumentFlow,
  studentDocumentationController.markDocumentAsInReview
);

// Eliminar un documento (eliminación lógica + renombrar en FTP)
router.delete(
  '/:documentID',
  authMiddleware,
  checkUserType(['student']),
  studentDocumentationController.deleteDocument
);

// Editar metadatos de un documento (tipo, nombre, estado)
router.patch(
  '/:documentID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  studentDocumentationController.patchDocument
);

module.exports = router;
