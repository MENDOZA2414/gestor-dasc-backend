const express = require('express');
const router = express.Router();
const { registerUserController, loginUserController } = require('../controllers/UserController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Ruta para registrar un nuevo usuario (pública)
router.post('/register', registerUserController);

// Ruta para iniciar sesión (pública)
router.post('/login', loginUserController);

// Ejemplo de ruta protegida (necesita token)
router.get('/protected', authMiddleware, (req, res) => {
    res.send({ message: 'Acceso autorizado, usuario autenticado', user: req.user });
});

module.exports = router;
