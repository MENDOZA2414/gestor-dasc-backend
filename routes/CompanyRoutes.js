const express = require('express');
const router = express.Router();

const companyController = require('../controllers/CompanyController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Endpoints para gestión de entidades receptoras
 */

/**
 * @swagger
 * /api/companies/register:
 *   post:
 *     summary: Registrar una nueva entidad receptora
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Entidad receptora registrada exitosamente
 */
router.post(
  '/register',
  profileUploadMiddleware,
  companyController.registerCompany
);

/**
 * @swagger
 * /api/companies/all:
 *   get:
 *     summary: Obtener todas las entidades receptoras
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de entidades receptoras
 */
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getAllCompanies
);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Obtener entidades receptoras por estatus
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista filtrada por estatus
 */
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getCompaniesByStatus
);

/**
 * @swagger
 * /api/companies/count:
 *   get:
 *     summary: Obtener el total de entidades receptoras
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo total de entidades
 */
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.countCompaniesController
);

/**
 * @swagger
 * /api/companies/me:
 *   get:
 *     summary: Obtener el perfil de la entidad receptora autenticada
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de la empresa autenticada
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['company']),
  companyController.getCompanyProfile
);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtener entidad receptora por ID
 *     tags: [Company]
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
 *         description: Entidad receptora encontrada
 */
router.get(
  '/:id',
  authMiddleware,
  companyController.getCompanyByID
);

/**
 * @swagger
 * /api/companies/{userID}:
 *   patch:
 *     summary: Actualizar parcialmente los datos de una entidad receptora
 *     tags: [Company]
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
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entidad receptora actualizada
 */
router.patch(
  '/:userID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.patchCompanyController
);

/**
 * @swagger
 * /api/companies/{userID}/status:
 *   patch:
 *     summary: Cambiar el estatus de una entidad receptora
 *     tags: [Company]
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
  companyController.updateStatus
);

/**
 * @swagger
 * /api/companies/{companyID}:
 *   delete:
 *     summary: Eliminar lógicamente una entidad receptora
 *     tags: [Company]
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
 *         description: Entidad eliminada
 */
router.delete(
  '/:companyID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  companyController.deleteCompany
);

module.exports = router;