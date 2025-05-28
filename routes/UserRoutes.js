const express = require('express');
const router = express.Router();

const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkOwnershipOrAdmin = require('../middlewares/CheckOwnershipOrAdmin');
const { getUserOwnerID } = require('../utils/ownershipResolvers');
const loginLimiter = require('../middlewares/LoginLimiter');
const { uploadProfilePhoto } = require('../controllers/ProfileController');

const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserByIDController,
  patchUserController,
  patchUserStatusController,
  changePasswordController,
  requestPasswordResetController,
  resetPasswordController,
  deleteUserController,
  getUserProfileAndRoles
} = require('../controllers/UserController');

// ──────── Rutas públicas ────────

// Registro de usuario
router.post('/register', registerUserController);

// Iniciar sesión (limite de intentos)
router.post('/login', loginLimiter, (req, res, next) => {
  req.remainingAttempts = req.loginTracking?.remaining;
  req.retryAfter = req.loginTracking?.retryAfter;
  next();
}, loginUserController);

// Restablecimiento de contraseña
router.post('/request-password-reset', requestPasswordResetController);
router.post('/reset-password', resetPasswordController);

// ──────── Rutas protegidas ────────

// Obtener perfil autenticado
router.get('/me', authMiddleware, getUserProfileAndRoles);

// Subir foto de perfil
router.post('/upload-profile-photo', authMiddleware, uploadProfile, uploadProfilePhoto);

// Cerrar sesión
router.post('/logout', authMiddleware, logoutUserController);

// Cambiar contraseña propia
router.patch('/change-password', authMiddleware, changePasswordController);

// Obtener usuario por ID
router.get('/:userID', authMiddleware, checkRole(['Admin', 'SuperAdmin']), getUserByIDController);

// Actualizar parcialmente (correo o teléfono)
router.patch('/:userID', authMiddleware, checkOwnershipOrAdmin(getUserOwnerID), patchUserController);

// Cambiar estatus de usuario (solo SuperAdmin)
router.patch('/:userID/status', authMiddleware, checkRole(['SuperAdmin']), patchUserStatusController);

// Eliminar lógicamente
router.delete('/:userID', authMiddleware, checkRole(['SuperAdmin']), deleteUserController);

module.exports = router;
