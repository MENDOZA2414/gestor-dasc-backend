const express = require('express');
const router = express.Router();

const studentApplicationController = require('../controllers/StudentApplicationController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const documentUpload = require('../middlewares/DocumentUpload');

/**
 * @swagger
 * tags:
 *   name: StudentApplication
 *   description: Endpoints para postulaciones a vacantes
 */

/**
 * @swagger
 * /api/student-applications/me:
 *   get:
 *     summary: Obtener las postulaciones del alumno autenticado
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones del alumno
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  studentApplicationController.getApplicationsByLoggedStudent
);

/**
 * @swagger
 * /api/student-applications/my-company:
 *   get:
 *     summary: Obtener postulaciones recibidas por la empresa autenticada
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones recibidas
 */
router.get(
  '/my-company',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.getApplicationsByMyCompany
);

/**
 * @swagger
 * /api/student-applications/company/{companyID}:
 *   get:
 *     summary: Obtener postulaciones por ID de empresa (solo Admin/SuperAdmin)
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: companyID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de postulaciones
 */
router.get(
  '/company/:companyID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByCompanyID
);

/**
 * @swagger
 * /api/student-applications/position/{positionID}:
 *   get:
 *     summary: Obtener postulaciones por ID de vacante
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: positionID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de postulaciones
 */
router.get(
  '/position/:positionID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByPositionID
);

/**
 * @swagger
 * /api/student-applications/student/{studentID}:
 *   get:
 *     summary: Obtener postulaciones por ID de estudiante
 *     tags: [StudentApplication]
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
 *         description: Lista de postulaciones
 */
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByStudentID
);

/**
 * @swagger
 * /api/student-applications/status/{status}:
 *   get:
 *     summary: Obtener postulaciones por estatus
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pendiente, Preaceptado, Aceptado, Rechazado]
 *     responses:
 *       200:
 *         description: Lista de postulaciones filtradas
 */
router.get(
  '/status/:status',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByStatus
);

/**
 * @swagger
 * /api/student-applications/cover-letter/{id}:
 *   get:
 *     summary: Obtener nombre y URL de la carta de presentación de una postulación
 *     tags: [StudentApplication]
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
 *         description: Carta obtenida exitosamente
 */
router.get(
  '/cover-letter/:id',
  authMiddleware,
  checkUserTypeOrRole(['student', 'company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getCoverLetterByID
);

/**
 * @swagger
 * /api/student-applications/register:
 *   post:
 *     summary: Registrar una nueva postulación (alumno)
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - practicePositionID
 *               - coverLetter
 *             properties:
 *               practicePositionID:
 *                 type: integer
 *               coverLetter:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Postulación registrada correctamente
 */
router.post(
  '/register',
  authMiddleware,
  checkUserType(['student']),
  documentUpload,
  studentApplicationController.registerApplication
);

/**
 * @swagger
 * /api/student-applications/update/{applicationID}:
 *   patch:
 *     summary: Actualizar datos de una postulación (asesor o admin)
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: applicationID
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
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Postulación actualizada
 */
router.patch(
  '/update/:applicationID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  studentApplicationController.patchApplicationController
);

/**
 * @swagger
 * /api/student-applications/status/{applicationID}:
 *   patch:
 *     summary: Cambiar estatus de una postulación (empresa)
 *     tags: [StudentApplication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: applicationID
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Rechazado, Preaceptado]
 *     responses:
 *       200:
 *         description: Estatus actualizado correctamente
 */
router.patch(
  '/status/:applicationID',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.updateApplicationStatusByCompany
);

module.exports = router;