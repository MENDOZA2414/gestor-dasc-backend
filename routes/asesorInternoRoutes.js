const express = require('express');
const router = express.Router();
const asesorInternoController = require('../controllers/asesorInternoController');

// Ruta para probar la conexión y contar el número de asesores internos
router.get('/testConnection', asesorInternoController.contarAsesoresInternos);

// Ruta para obtener un asesor interno por ID
router.get('/:id', asesorInternoController.obtenerAsesorInternoPorID);

// Ruta para obtener todos los asesores internos
router.get('/', asesorInternoController.obtenerTodosLosAsesoresInternos);

// Ruta para el inicio de sesión de asesor interno
router.post('/login', asesorInternoController.iniciarSesionAsesorInterno);

module.exports = router;
