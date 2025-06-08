const express = require('express');
const router = express.Router();

const practicePositionController = require('../controllers/PracticePositionController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

/**
 * @swagger
 * tags:
 *   name: PracticePosition
 *   description: Endpoints para gestión de vacantes de prácticas profesionales
 */

/**
 * @swagger
 * /api/practicePositions/create:
 *   post:
 *     summary: Crear nueva vacante de práctica profesional
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionName
 *               - startDate
 *               - endDate
 *               - city
 *               - positionType
 *               - description
 *               - companyID
 *               - externalAssessorID
 *             properties:
 *               positionName:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               positionType:
 *                 type: string
 *                 enum: [Remoto, Presencial, Semi-presencial]
 *               description:
 *                 type: string
 *               companyID:
 *                 type: integer
 *               externalAssessorID:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Vacante creada exitosamente
 */
router.post(
  '/create',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  practicePositionController.createPosition
);

/**
 * @swagger
 * /api/practicePositions/all/{page}/{limit}:
 *   get:
 *     summary: Obtener todas las vacantes (paginadas)
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de vacantes
 */
router.get(
  '/all/:page/:limit',
  authMiddleware,
  practicePositionController.getAllPositions
);

/**
 * @swagger
 * /api/practicePositions:
 *   get:
 *     summary: Obtener vacantes filtradas por estatus
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacantes filtradas por estatus
 */
router.get(
  '/',
  authMiddleware,
  practicePositionController.getPositionsByStatus
);

/**
 * @swagger
 * /api/practicePositions/entidad/{entidadID}:
 *   get:
 *     summary: Obtener vacantes por ID de entidad receptora
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entidadID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de vacantes de la entidad
 */
router.get(
  '/entidad/:entidadID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.getPositionsByCompanyID
);

/**
 * @swagger
 * /api/practicePositions/{id}:
 *   get:
 *     summary: Obtener vacante por ID
 *     tags: [PracticePosition]
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
 *         description: Detalles de la vacante
 */
router.get(
  '/:id',
  authMiddleware,
  practicePositionController.getPositionByID
);

/**
 * @swagger
 * /api/practicePositions/{id}:
 *   patch:
 *     summary: Actualizar parcialmente una vacante por ID
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *               positionName:
 *                 type: string
 *               description:
 *                 type: string
 *               maxStudents:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vacante actualizada
 */
router.patch(
  '/:id',
  authMiddleware,
  practicePositionController.patchPositionController
);

/**
 * @swagger
 * /api/practicePositions/status/{id}:
 *   patch:
 *     summary: Cambiar estatus de una vacante (aceptar/rechazar)
 *     tags: [PracticePosition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *                 enum: [Pendiente, Aceptado, Rechazado, Inactiva, Cerrado]
 *     responses:
 *       200:
 *         description: Estatus actualizado
 */
router.patch(
  '/status/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.patchPositionStatus
);

/**
 * @swagger
 * /api/practicePositions/delete/{id}:
 *   delete:
 *     summary: Eliminar vacante de forma lógica (solo SuperAdmin)
 *     tags: [PracticePosition]
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
 *         description: Vacante eliminada
 */
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  practicePositionController.deletePositionControlled
);

module.exports = router;