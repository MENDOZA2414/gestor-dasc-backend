const express = require('express');
const router = express.Router();

const studentController = require('../controllers/StudentController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Endpoints para el manejo de estudiantes
 */

/**
 * @swagger
 * /api/students/register:
 *   post:
 *     summary: Registrar un nuevo estudiante
 *     tags: [Student]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - controlNumber
 *               - email
 *               - password
 *               - phone
 *               - firstName
 *               - firstLastName
 *               - dateOfBirth
 *               - career
 *               - semester
 *               - shift
 *             properties:
 *               controlNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               firstName:
 *                 type: string
 *               firstLastName:
 *                 type: string
 *               secondLastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               career:
 *                 type: string
 *               semester:
 *                 type: string
 *               shift:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Estudiante registrado exitosamente
 *       400:
 *         description: Datos inválidos o incompletos
 */
router.post(
  '/register',
  profileUploadMiddleware,
  studentController.registerStudentController
);

/**
 * @swagger
 * /api/students/all:
 *   get:
 *     summary: Obtener todos los estudiantes (solo Admin/SuperAdmin)
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de estudiantes
 */
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getAllStudents
);

/**
 * @swagger
 * /api/students/count:
 *   get:
 *     summary: Obtener el conteo total de estudiantes
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad total de estudiantes
 */
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.countStudents
);

/**
 * @swagger
 * /api/students/by-assessor:
 *   get:
 *     summary: Obtener los estudiantes asignados al asesor autenticado
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes asignados
 */
router.get(
  '/by-assessor',
  authMiddleware,
  checkUserType(['internalAssessor']),
  studentController.getStudentsByLoggedAssessor
);

/**
 * @swagger
 * /api/students/assessor/{internalAssessorID}:
 *   get:
 *     summary: Obtener estudiantes por ID de asesor interno
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: internalAssessorID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de estudiantes por asesor
 */
router.get(
  '/assessor/:internalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByInternalAssessorID
);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Obtener estudiantes filtrados por estatus y asesor
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes filtrados
 */
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatusAndAssessorID
);

/**
 * @swagger
 * /api/students/by-student-status:
 *   get:
 *     summary: Obtener estudiantes por estatus general
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes por estatus
 */
router.get(
  '/by-student-status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatus
);

/**
 * @swagger
 * /api/students/me:
 *   get:
 *     summary: Obtener el perfil del estudiante autenticado
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del estudiante
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  studentController.getStudentProfile
);

/**
 * @swagger
 * /api/students/{controlNumber}:
 *   get:
 *     summary: Obtener estudiante por número de control
 *     tags: [Student]
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
 *         description: Datos del estudiante
 */
router.get(
  '/:controlNumber',
  authMiddleware,
  studentController.getStudentByControlNumber
);

/**
 * @swagger
 * /api/students/{controlNumber}:
 *   patch:
 *     summary: Actualizar parcialmente los datos del estudiante
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: controlNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               semester:
 *                 type: string
 *     responses:
 *       200:
 *         description: Datos actualizados correctamente
 */
router.patch(
  '/:controlNumber',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.patchStudentController
);

/**
 * @swagger
 * /api/students/{controlNumber}/assessor:
 *   patch:
 *     summary: Reasignar asesor interno a un estudiante
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: controlNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - internalAssessorID
 *             properties:
 *               internalAssessorID:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Asesor reasignado correctamente
 */
router.patch(
  '/:controlNumber/assessor',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.reassignAssessorController
);

/**
 * @swagger
 * /api/students/{controlNumber}/status:
 *   patch:
 *     summary: Cambiar el estatus del estudiante
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: controlNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [Pendiente, Aceptado, Rechazado]
 *     responses:
 *       200:
 *         description: Estatus actualizado
 */
router.patch(
  '/:controlNumber/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.updateStatus
);

/**
 * @swagger
 * /api/students/{controlNumber}:
 *   delete:
 *     summary: Eliminar lógicamente un estudiante por número de control
 *     tags: [Student]
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
 *         description: Estudiante eliminado
 */
router.delete(
  '/:controlNumber',
  authMiddleware,
  checkRole(['SuperAdmin']),
  studentController.deleteStudentByControlNumber
);

module.exports = router;