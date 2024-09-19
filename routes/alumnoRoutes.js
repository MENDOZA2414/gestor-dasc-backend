const express = require('express');
const router = express.Router();
const alumnoController = require('../controllers/alumnoController');

// Ruta para registrar un alumno
router.post('/registro', alumnoController.registrarAlumnoController);

// Ruta para obtener un alumno por numControl
router.get('/:numControl', alumnoController.obtenerAlumnoPorNumControl);

// Ruta para obtener la imagen de perfil de un alumno por numControl
router.get('/imagen/:numControl', alumnoController.obtenerImagenPerfilPorNumControl);

// Ruta para obtener los alumnos asignados a un asesor
router.get('/asesor/:asesorID', alumnoController.obtenerAlumnosPorAsesorID);

// Ruta para obtener todos los alumnos asignados a un asesor interno
router.get('/todos', alumnoController.obtenerTodosLosAlumnos);

// Ruta para obtener alumnos por estatus y asesor interno ID
router.get('/', alumnoController.obtenerAlumnosPorEstatusYAsesorID);

// Ruta para eliminar un alumno por numControl
router.delete('/:numControl', alumnoController.eliminarPorNumControl);

module.exports = router;
