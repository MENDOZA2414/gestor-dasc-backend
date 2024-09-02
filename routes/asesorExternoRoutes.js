const express = require('express');
const router = express.Router();
const asesorExternoController = require('../controllers/asesorExternoController');

// Ruta para obtener un asesor externo por ID
router.get('/:id', asesorExternoController.obtenerAsesorExternoPorID);

// Ruta para el inicio de sesión de asesor externo
router.post('/login', asesorExternoController.iniciarSesionAsesorExterno);

module.exports = router;
