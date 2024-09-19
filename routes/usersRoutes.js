const express = require('express');
const router = express.Router();
const { registrarUsuarioController, loginUsuarioController } = require('../controllers/usersController');

// Ruta para registrar un nuevo usuario
router.post('/register', registrarUsuarioController);

// Ruta para iniciar sesión
router.post('/login', loginUsuarioController);

module.exports = router;
