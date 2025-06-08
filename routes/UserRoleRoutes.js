const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/UserRoleController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

/**
 * @swagger
 * tags:
 *   name: UserRole
 *   description: Endpoints para asignación y consulta de roles de usuario
 */

/**
 * @swagger
 * /api/user-roles/assign:
 *   post:
 *     summary: Asignar uno o varios roles a un usuario
 *     tags: [UserRole]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userID
 *               - roleIDs
 *             properties:
 *               userID:
 *                 type: integer
 *                 example: 12
 *               roleIDs:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       200:
 *         description: Roles asignados correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/assign', authMiddleware, checkRole(['Admin', 'SuperAdmin']), userRoleController.assignRoles);

/**
 * @swagger
 * /api/user-roles/me:
 *   get:
 *     summary: Obtener los roles del usuario autenticado
 *     tags: [UserRole]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles del usuario
 */
router.get('/me', authMiddleware, userRoleController.getMyRoles);

/**
 * @swagger
 * /api/user-roles/{userID}:
 *   get:
 *     summary: Obtener los roles de un usuario por ID (acceso abierto para pruebas)
 *     tags: [UserRole]
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Lista de roles del usuario especificado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userID', userRoleController.getUserRoles);

module.exports = router;