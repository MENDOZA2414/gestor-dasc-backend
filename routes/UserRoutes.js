const express = require('express');
const router = express.Router();
const { uploadProfilePhoto } = require('../controllers/ProfileController');
const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const rateLimit = require('express-rate-limit'); 
const { getUserProfileAndRoles } = require('../controllers/UserController');
const checkRole = require('../middlewares/CheckRole');

const {
    registerUserController,
    loginUserController,
    logoutUserController,
    getUserByIDController,
    patchUserController,
    deleteUserController
} = require('../controllers/UserController');

// Middleware de limitador de intentos de login
const trustedEmails = process.env.TRUSTED_ADMIN_EMAILS?.split(',') || [];
const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.email || req.ip,
  skip: (req) => {
    return trustedIPs.includes(req.ip) || trustedEmails.includes(req.body.email);
  },
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Demasiados intentos fallidos con este correo. Intenta de nuevo en 15 minutos.'
  },
  handler: (req, res, next, options) => {
    console.warn(`⚠️ Límite alcanzado para: ${req.body.email || req.ip}`);
    res.status(options.statusCode || 429).json(options.message);
  }
});

// Ruta para registrar un nuevo usuario (pública)
router.post('/register', registerUserController);

// Ruta para iniciar sesión (pública, protegida con loginLimiter)
router.post('/login', loginLimiter, loginUserController);

// Ruta para cerrar sesión 
router.get('/logout', authMiddleware, logoutUserController);

// Ruta para obtener el perfil del usuario autenticado (protegida)
router.get('/me', authMiddleware, getUserProfileAndRoles);

// Subir o actualizar foto de perfil (protegida)
router.post('/upload-profile-photo', authMiddleware, uploadProfile, uploadProfilePhoto);

// Ejemplo de ruta protegida (necesita token)
router.get('/protected', authMiddleware, (req, res) => {
    res.send({ message: 'Acceso autorizado, usuario autenticado', user: req.user });
});

// Obtener usuario por ID (protegida)
router.get('/:userID', authMiddleware, checkRole(['Admin', 'SuperAdmin']), getUserByIDController);

// Actualizar usuario parcialmente por ID
router.patch('/:userID', authMiddleware, checkRole(['Admin', 'SuperAdmin']), patchUserController);

// Eliminar lógicamente un usuario por ID (protegida)
router.delete('/:userID', authMiddleware, checkRole(['SuperAdmin']), deleteUserController);

module.exports = router;