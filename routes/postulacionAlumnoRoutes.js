const express = require('express');
const router = express.Router();
const postulacionAlumnoController = require('../controllers/postulacionAlumnoController');

// Ruta para obtener aplicaciones por vacante ID
router.get('/vacante/:vacanteID', postulacionAlumnoController.obtenerAplicacionesPorVacanteID);

// Ruta para obtener una carta de presentación por ID de postulación
router.get('/carta/:id', postulacionAlumnoController.obtenerCartaPresentacionPorID);

// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get('/check/:alumnoID/:vacanteID', postulacionAlumnoController.verificarPostulacionAlumno);

// Ruta para obtener postulaciones por ID de alumno
router.get('/alumno/:alumnoID', postulacionAlumnoController.obtenerPostulacionesPorAlumnoID);

// Ruta para rechazar una postulación
router.post('/rechazar', postulacionAlumnoController.rechazarPostulacion);

// Ruta para aceptar una postulación
router.post('/aceptar', postulacionAlumnoController.aceptarPostulacion);

module.exports = router;
