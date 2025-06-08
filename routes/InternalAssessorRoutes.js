const express = require('express');
const router = express.Router();

const internalAssessorController = require('../controllers/InternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

/**
 * @swagger
 * tags:
 *   name: InternalAssessor
 *   description: Endpoints para gestión de asesores internos
 */

/**
 * @swagger
 * /api/internal-assessors:
 *   get:
 *     summary: Obtener todos los asesores internos (visible para alumnos)
 *     tags: [InternalAssessor]
 *     responses:
 *       200:
 *         description: Lista de asesores internos
 */
router.get('/', internalAssessorController.getAllInternalAssessors);

/**
 * @swagger
 * /api/internal-assessors/me:
 *   get:
 *     summary: Obtener el perfil del asesor interno autenticado
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del asesor interno
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['internalAssessor']),
  internalAssessorController.getInternalAssessorProfile
);

/**
 * @swagger
 * /api/internal-assessors/count:
 *   get:
 *     summary: Obtener el conteo total de asesores internos
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total de asesores internos
 */
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.countInternalAssessors
);

/**
 * @swagger
 * /api/internal-assessors/{id}:
 *   get:
 *     summary: Obtener asesor interno por ID
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asesor interno encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  internalAssessorController.getInternalAssessorByID
);

/**
 * @swagger
 * /api/internal-assessors/register:
 *   post:
 *     summary: Registrar un nuevo asesor interno
 *     tags: [InternalAssessor]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Asesor interno registrado exitosamente
 */
router.post(
  '/register',
  profileUploadMiddleware,
  internalAssessorController.registerInternalAssessorController
);

/**
 * @swagger
 * /api/internal-assessors/{id}:
 *   patch:
 *     summary: Actualizar parcialmente los datos de un asesor interno
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asesor actualizado
 */
router.patch(
  '/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.patchInternalAssessorController
);

/**
 * @swagger
 * /api/internal-assessors/{userID}/status:
 *   patch:
 *     summary: Cambiar el estatus del asesor interno
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userID
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
 *                 enum: [Pendiente, Aceptado, Rechazado]
 *     responses:
 *       200:
 *         description: Estatus actualizado
 */
router.patch(
  '/:userID/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.updatestatus
);

/**
 * @swagger
 * /api/internal-assessors/{id}:
 *   delete:
 *     summary: Eliminar lógicamente un asesor interno
 *     tags: [InternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asesor eliminado
 */
router.delete(
  '/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  internalAssessorController.deleteInternalAssessor
);

module.exports = router;