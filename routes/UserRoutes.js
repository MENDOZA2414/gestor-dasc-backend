const express = require('express');
const router = express.Router();
const { uploadProfilePhoto } = require('../controllers/ProfileController');
const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const rateLimit = require('express-rate-limit'); // Asegúrate de tener esta línea

const {
    registerUserController,
    loginUserController,
    logoutUserController,
    getUserByIDController,
    updateUserController,
    deleteUserController
} = require('../controllers/UserController');

// Middleware de limitador de intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip,
  message: 'Demasiados intentos fallidos con este correo. Intenta de nuevo en 15 minutos.'
});


// Ruta para registrar un nuevo usuario (pública)
router.post('/register', registerUserController);

// Ruta para iniciar sesión (pública, protegida con loginLimiter)
router.post('/login', loginLimiter, loginUserController);

// Ruta para cerrar sesión (pública)
router.get('/logout', logoutUserController);

// Subir o actualizar foto de perfil (protegida)
router.post('/upload-profile-photo', authMiddleware, uploadProfile, uploadProfilePhoto);

// Ejemplo de ruta protegida (necesita token)
router.get('/protected', authMiddleware, (req, res) => {
    res.send({ message: 'Acceso autorizado, usuario autenticado', user: req.user });
});

// Obtener usuario por ID (protegida)
router.get('/:userID', authMiddleware, getUserByIDController);

// Actualizar usuario por ID (protegida)
router.put('/:userID', authMiddleware, updateUserController);

// Eliminar lógicamente un usuario por ID (protegida)
router.delete('/:userID', authMiddleware, deleteUserController);

module.exports = router;
