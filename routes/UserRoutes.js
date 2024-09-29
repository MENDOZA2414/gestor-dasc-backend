const express = require('express');
const router = express.Router();
const { registerUserController, loginUserController } = require('../controllers/UserController');

// Ruta para registrar un nuevo usuario
router.post('/register', registerUserController);

// Ruta para iniciar sesión
router.post('/login', loginUserController);

module.exports = router;
