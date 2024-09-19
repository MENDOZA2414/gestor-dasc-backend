const express = require('express');
const router = express.Router();
const asesorInternoController = require('../controllers/asesorInternoController');

// Ruta para registrar un asesor interno
router.post('/registro', asesorInternoController.registrarAsesorInternoController);

// Ruta para probar la conexión y contar el número de asesores internos
router.get('/testConnection', asesorInternoController.contarAsesoresInternos);

// Ruta para obtener un asesor interno por ID
router.get('/:id', asesorInternoController.obtenerAsesorInternoPorID);

// Ruta para obtener todos los asesores internos
router.get('/', asesorInternoController.obtenerTodosLosAsesoresInternos);

module.exports = router;
