const express = require('express');
const router = express.Router();
const studentApplicationController = require('../controllers/studentApplicationController');

// Ruta para obtener aplicaciones por vacante ID
router.get('/position/:positionID', studentApplicationController.getApplicationsByPositionID);

// Ruta para obtener una carta de presentación por ID de postulación
router.get('/cover-letter/:id', studentApplicationController.getCoverLetterByID);

// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get('/check/:studentID/:positionID', studentApplicationController.verifyStudentApplication);

// Ruta para obtener postulaciones por ID de alumno
router.get('/student/:studentID', studentApplicationController.getApplicationsByStudentID);

// Ruta para rechazar una postulación
router.post('/reject', studentApplicationController.rejectApplication);

// Ruta para aceptar una postulación
router.post('/accept', studentApplicationController.acceptApplication);

module.exports = router;
