const express = require('express');
const router = express.Router();
const externalAssessorController = require('../controllers/ExternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

/**
 * @swagger
 * tags:
 *   name: ExternalAssessor
 *   description: Endpoints para gestión de asesores externos
 */

/**
 * @swagger
 * /api/external-assessors/register:
 *   post:
 *     summary: Registrar un nuevo asesor externo
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
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
 *               companyID:
 *                 type: integer
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Asesor externo registrado correctamente
 */
router.post(
  '/register',
  authMiddleware,
  profileUploadMiddleware,
  externalAssessorController.registerExternalAssessorController
);

/**
 * @swagger
 * /api/external-assessors/all:
 *   get:
 *     summary: Obtener todos los asesores externos
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de asesores externos
 */
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  externalAssessorController.getAllExternalAssessorsController
);

/**
 * @swagger
 * /api/external-assessors/count:
 *   get:
 *     summary: Obtener el total de asesores externos registrados
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total de asesores externos
 */
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  externalAssessorController.countExternalAssessorsController
);

/**
 * @swagger
 * /api/external-assessors/{id}:
 *   get:
 *     summary: Obtener un asesor externo por su ID
 *     tags: [ExternalAssessor]
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
 *         description: Asesor externo encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  externalAssessorController.getExternalAssessorByIDController
);

/**
 * @swagger
 * /api/external-assessors/company/{companyID}:
 *   get:
 *     summary: Obtener asesores externos asociados a una empresa
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de asesores de la empresa
 */
router.get(
  '/company/:companyID',
  authMiddleware,
  externalAssessorController.getExternalAssessorsByCompanyIDController
);

/**
 * @swagger
 * /api/external-assessors/{externalAssessorID}:
 *   patch:
 *     summary: Actualizar parcialmente un asesor externo
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: externalAssessorID
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
 *         description: Asesor externo actualizado
 */
router.patch(
  '/:externalAssessorID',
  authMiddleware,
  externalAssessorController.patchExternalAssessorController
);

/**
 * @swagger
 * /api/external-assessors/{externalAssessorID}:
 *   delete:
 *     summary: Eliminar un asesor externo
 *     tags: [ExternalAssessor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: externalAssessorID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asesor externo eliminado
 */
router.delete(
  '/:externalAssessorID',
  authMiddleware,
  externalAssessorController.deleteExternalAssessorController
);

module.exports = router;