const express = require('express');
const router = express.Router();

const professionalPracticeController = require('../controllers/ProfessionalPracticeController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

/**
 * @swagger
 * tags:
 *   name: ProfessionalPractice
 *   description: Endpoints para gestión de prácticas profesionales
 */

/**
 * @swagger
 * /api/professional-practices:
 *   get:
 *     summary: Obtener todas las prácticas (uso administrativo)
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de prácticas
 */
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.getAllPractices
);

/**
 * @swagger
 * /api/professional-practices/me:
 *   get:
 *     summary: Obtener práctica del alumno autenticado
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de la práctica
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  professionalPracticeController.getPracticeByLoggedStudent
);

/**
 * @swagger
 * /api/professional-practices/progress/me:
 *   get:
 *     summary: Obtener progreso de la práctica del alumno autenticado
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progreso de la práctica
 */
router.get(
  '/progress/me',
  authMiddleware,
  checkUserType(['student']),
  professionalPracticeController.getMyPracticeProgress
);

/**
 * @swagger
 * /api/professional-practices/count-by-status:
 *   get:
 *     summary: Contar prácticas por estatus
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo por estatus
 */
router.get(
  '/count-by-status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.countPracticesByStatus
);

/**
 * @swagger
 * /api/professional-practices/progress/student/{studentID}:
 *   get:
 *     summary: Obtener progreso de práctica de un estudiante
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progreso de la práctica
 */
router.get(
  '/progress/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(
    ['student', 'internalAssessor', 'externalAssessor', 'company'],
    ['Admin', 'SuperAdmin']
  ),
  professionalPracticeController.getPracticeProgress
);

/**
 * @swagger
 * /api/professional-practices/student/{studentID}:
 *   get:
 *     summary: Obtener práctica de un alumno
 *     tags: [ProfessionalPractice]
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
 *         description: Práctica encontrada
 */
router.get(
  '/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticeByStudentID
);

/**
 * @swagger
 * /api/professional-practices/company/{companyID}:
 *   get:
 *     summary: Obtener prácticas por empresa
 *     tags: [ProfessionalPractice]
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
 *         description: Lista de prácticas
 */
router.get(
  '/company/:companyID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByCompanyID
);

/**
 * @swagger
 * /api/professional-practices/students/company/{companyID}:
 *   get:
 *     summary: Obtener estudiantes haciendo prácticas en una empresa
 *     tags: [ProfessionalPractice]
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
 *         description: Lista de estudiantes
 */
router.get(
  '/students/company/:companyID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getStudentsByCompanyID
);

/**
 * @swagger
 * /api/professional-practices/internal-assessor/{internalAssessorID}:
 *   get:
 *     summary: Obtener prácticas asignadas a un asesor interno
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: internalAssessorID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de prácticas
 */
router.get(
  '/internal-assessor/:internalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByInternalAssessorID
);

/**
 * @swagger
 * /api/professional-practices/internal-assessor/{internalAssessorID}/student/{studentID}:
 *   get:
 *     summary: Obtener práctica específica de un alumno para su asesor interno
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: internalAssessorID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: studentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Práctica del alumno
 */
router.get(
  '/internal-assessor/:internalAssessorID/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getStudentPracticeByAssessor
);

/**
 * @swagger
 * /api/professional-practices/external-assessor/{externalAssessorID}:
 *   get:
 *     summary: Obtener prácticas asignadas a un asesor externo
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: externalAssessorID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de prácticas
 */
router.get(
  '/external-assessor/:externalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['externalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByExternalAssessorID
);

/**
 * @swagger
 * /api/professional-practices/students/external-assessor/{externalAssessorID}:
 *   get:
 *     summary: Obtener estudiantes asignados a un asesor externo
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: externalAssessorID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 */
router.get(
  '/students/external-assessor/:externalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['externalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getStudentsByExternalAssessorID
);

/**
 * @swagger
 * /api/professional-practices/stats/top-companies:
 *   get:
 *     summary: Obtener top 5 empresas más solicitadas
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas más populares
 */
router.get(
  '/stats/top-companies',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.getTopCompaniesStats
);

/**
 * @swagger
 * /api/professional-practices/{practiceID}:
 *   patch:
 *     summary: Actualizar datos generales de una práctica
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: practiceID
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
 *     responses:
 *       200:
 *         description: Práctica actualizada
 */
router.patch(
  '/:practiceID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.patchPractice
);

/**
 * @swagger
 * /api/professional-practices/{practiceID}/status:
 *   patch:
 *     summary: Cambiar estatus de la práctica
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: practiceID
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
 *                 enum: [Started, Finished, Cancelled]
 *     responses:
 *       200:
 *         description: Estatus actualizado
 */
router.patch(
  '/:practiceID/status',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.updatePracticeStatus
);

/**
 * @swagger
 * /api/professional-practices/{practiceID}/progress:
 *   patch:
 *     summary: Actualizar progreso de la práctica profesional
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: practiceID
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
 *               progressStep:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Progreso actualizado
 */
router.patch(
  '/:practiceID/progress',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.updatePracticeProgress
);

/**
 * @swagger
 * /api/professional-practices/{practiceID}:
 *   delete:
 *     summary: Eliminar una práctica profesional (lógicamente)
 *     tags: [ProfessionalPractice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: practiceID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Práctica eliminada
 */
router.delete(
  '/:practiceID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  professionalPracticeController.deletePractice
);

module.exports = router;