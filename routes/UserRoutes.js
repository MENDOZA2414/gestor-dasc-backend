const express = require('express');
const router = express.Router();
const { uploadProfilePhoto } = require('../controllers/ProfileController');
const uploadProfile = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const {
    registerUserController,
    loginUserController,
    logoutUserController,
    getUserByIDController,
    updateUserController,
    deleteUserController
} = require('../controllers/UserController');

// Ruta para registrar un nuevo usuario (pública)
router.post('/register', registerUserController);

// Ruta para iniciar sesión (pública)
router.post('/login', loginUserController);

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
