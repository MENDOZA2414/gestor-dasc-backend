const express = require('express');
const router = express.Router();
const { uploadProfilePhoto } = require('../controllers/ProfileController');
const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
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

// Importar los middlewares desde archivo separado
const loginLimiter = require('../middlewares/LoginLimiter');

// Ruta para registrar un nuevo usuario (pública)
router.post('/register', registerUserController);

// Ruta para iniciar sesión (pública, protegida con loginLimiter y rastreador)
router.post('/login', loginLimiter, (req, res, next) => {
  req.remainingAttempts = req.loginTracking?.remaining;
  req.retryAfter = req.loginTracking?.retryAfter;
  next();
}, loginUserController);

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
