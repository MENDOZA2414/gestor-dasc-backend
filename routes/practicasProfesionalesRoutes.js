const express = require('express');
const router = express.Router();
const practicasProfesionalesController = require('../controllers/practicasProfesionalesController');

// Ruta para obtener la última práctica profesional de un alumno por su número de control
router.get('/alumno/:numControl', practicasProfesionalesController.obtenerUltimaPracticaPorNumControl);

module.exports = router;
