const express = require('express');
const router = express.Router();

const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkOwnershipOrAdmin = require('../middlewares/CheckOwnershipOrAdmin');
const { getUserOwnerID } = require('../utils/ownershipResolvers');
const loginLimiter = require('../middlewares/LoginLimiter');
const { uploadProfilePhoto } = require('../controllers/ProfileController');
const { getUnreadNotificationsController } = require('../controllers/UserController');

const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserByIDController,
  patchUserController,
  patchUserStatusController,
  patchUserActivationStatusController,
  changePasswordController,
  requestPasswordResetController,
  resetPasswordController,
  deleteUserController,
  getUserProfileAndRoles,
  patchOwnPhoneController,

} = require('../controllers/UserController');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Endpoints para manejo de usuarios
 */

// ──────── Rutas públicas ────────

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registro de nuevo usuario
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - phone
 *               - userTypeID
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               userTypeID:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos o incompletos
 */
router.post('/register', registerUserController);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 *       401:
 *         description: Credenciales inválidas o demasiados intentos
 */
router.post('/login', loginLimiter, (req, res, next) => {
  req.remainingAttempts = req.loginTracking?.remaining;
  req.retryAfter = req.loginTracking?.retryAfter;
  next();
}, loginUserController);

/**
 * @swagger
 * /api/users/request-password-reset:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instrucciones enviadas por correo
 *       404:
 *         description: Correo no registrado
 */
router.post('/request-password-reset', requestPasswordResetController);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', resetPasswordController);

// ──────── Rutas protegidas ────────

/**
 * @swagger
 * /api/users/protected:
 *   get:
 *     summary: Verificar validez de token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 */
router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Token válido', user: req.user });
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil y roles del usuario
 */
router.get('/me', authMiddleware, getUserProfileAndRoles);

/**
 * @swagger
 * /api/users/me/photo:
 *   patch:
 *     summary: Subir o actualizar foto de perfil del propio usuario
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto actualizada correctamente
 */
router.patch('/me/photo', authMiddleware, uploadProfile, uploadProfilePhoto);

/**
 * @swagger
 * /api/users/{userID}/photo:
 *   patch:
 *     summary: Actualizar foto de otro usuario (Admin o SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto actualizada
 */
router.patch('/:userID/photo', authMiddleware, checkRole(['Admin', 'SuperAdmin']), uploadProfile, uploadProfilePhoto);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Cerrar sesión del usuario
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', authMiddleware, logoutUserController);

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.patch('/change-password', authMiddleware, changePasswordController);

/**
 * @swagger
 * /api/users/notifications/unread:
 *   get:
 *     summary: Obtener notificaciones no leídas (solo Admin/SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/notifications/unread', authMiddleware, checkRole(['Admin', 'SuperAdmin']), getUnreadNotificationsController);

/**
 * @swagger
 * /api/users/{userID}:
 *   get:
 *     summary: Obtener usuario por ID (Admin/SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario
 */
router.get('/:userID', authMiddleware, checkRole(['Admin', 'SuperAdmin']), getUserByIDController);

/**
 * @swagger
 * /api/users/{userID}:
 *   patch:
 *     summary: Actualizar parcialmente datos de usuario (correo o teléfono)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.patch('/:userID', authMiddleware, checkOwnershipOrAdmin(getUserOwnerID), patchUserController);

/**
 * @swagger
 * /api/users/{userID}/status:
 *   patch:
 *     summary: Cambiar estatus de usuario (reactivar eliminado, solo SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estatus actualizado
 */
router.patch('/:userID/status', authMiddleware, checkRole(['SuperAdmin']), patchUserStatusController);

/**
 * @swagger
 * /api/users/{userID}/activation:
 *   patch:
 *     summary: Activar o desactivar usuario (Admin y SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activación actualizada
 */
router.patch('/:userID/activation', authMiddleware, checkRole(['Admin', 'SuperAdmin']), patchUserActivationStatusController);

/**
 * @swagger
 * /api/users/{userID}:
 *   delete:
 *     summary: Eliminar usuario lógicamente (solo SuperAdmin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/:userID', authMiddleware, checkRole(['SuperAdmin']), deleteUserController);

/**
 * @swagger
 * /api/users/me/phone:
 *   patch:
 *     summary: Actualizar teléfono del propio usuario
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teléfono actualizado
 */
router.patch('/me/phone', authMiddleware, patchOwnPhoneController);


module.exports = router;