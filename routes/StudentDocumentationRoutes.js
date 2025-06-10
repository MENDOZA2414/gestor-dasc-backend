const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/AuthMiddleware');
const studentDocumentationController = require('../controllers/StudentDocumentationController');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const validateDocumentFlow = require('../middlewares/ValidateDocumentFlow');
const validateDocumentApproval = require('../middlewares/ValidateDocumentApproval');

/**
 * @swagger
 * tags:
 *   name: StudentDocumentation
 *   description: Endpoints para manejo de documentos de estudiantes
 */

/**
 * @swagger
 * /api/student-documentation/student/{studentID}:
 *   get:
 *     summary: Obtener documentos de un estudiante por estatus
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de documentos filtrados por estatus
 */
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.getDocumentsByStudentAndStatus
);

/**
 * @swagger
 * /api/student-documentation/document/{id}:
 *   get:
 *     summary: Obtener un documento por su ID
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documento encontrado
 *       404:
 *         description: Documento no encontrado
 */
router.get(
  '/document/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.getDocumentByID
);

/**
 * @swagger
 * /api/student-documentation/count-accepted/{studentID}:
 *   get:
 *     summary: Contar documentos aceptados de un estudiante
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Número de documentos aceptados
 */
router.get(
  '/count-accepted/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  studentDocumentationController.countAcceptedDocuments
);

/**
 * @swagger
 * /api/student-documentation/approve:
 *   patch:
 *     summary: Aprobar un documento (Admin, SuperAdmin o Asesor Interno)
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentID
 *             properties:
 *               documentID:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Documento aprobado correctamente
 */
router.patch(
  '/approve',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  validateDocumentApproval,
  studentDocumentationController.approveDocument
);

/**
 * @swagger
 * /api/student-documentation/reject:
 *   post:
 *     summary: Rechazar un documento
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentID
 *               - reason
 *             properties:
 *               documentID:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento rechazado correctamente
 */
router.post(
  '/reject',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['internalAssessor']),
  studentDocumentationController.rejectDocument
);

/**
 * @swagger
 * /api/student-documentation/review/{documentID}:
 *   patch:
 *     summary: Marcar documento como "En Revisión"
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documento marcado como en revisión
 */
router.patch(
  '/review/:documentID',
  authMiddleware,
  checkUserType(['student']),
  validateDocumentFlow,
  studentDocumentationController.markDocumentAsInReview
);

/**
 * @swagger
 * /api/student-documentation/{documentID}:
 *   delete:
 *     summary: Eliminar lógicamente un documento (solo estudiante)
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documento eliminado
 */
router.delete(
  '/:documentID',
  authMiddleware,
  studentDocumentationController.deleteDocument
);

/**
 * @swagger
 * /api/student-documentation/{documentID}:
 *   patch:
 *     summary: Editar metadatos de un documento (solo SuperAdmin)
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *               fileName:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento actualizado
 */
router.patch(
  '/:documentID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  studentDocumentationController.patchDocument
);

/**
 * @swagger
 * /api/student-documentation/by-student/{studentID}:
 *   get:
 *     summary: Obtener todos los documentos de un alumno por studentID
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documentos obtenidos correctamente
 */
router.get(
  '/by-student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentDocumentationController.getAllDocumentsByStudentID
);

/**
 * @swagger
 * /api/student-documentation/by-control/{controlNumber}:
 *   get:
 *     summary: Obtener todos los documentos de un alumno por número de control
 *     tags: [StudentDocumentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: controlNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documentos obtenidos correctamente
 */
router.get(
  '/by-control/:controlNumber',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentDocumentationController.getAllDocumentsByControlNumber
);

module.exports = router;