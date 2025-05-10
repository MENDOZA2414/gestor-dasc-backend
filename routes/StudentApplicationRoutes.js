const express = require('express');
const router = express.Router();
const studentApplicationController = require('../controllers/StudentApplicationController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para obtener aplicaciones por vacante ID
router.get('/position/:positionID', studentApplicationController.getApplicationsByPositionID);

// Ruta para obtener nombre y URL de la carta de presentación por ID de postulación
router.get('/cover-letter/:id', studentApplicationController.getCoverLetterByID);

// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get('/check/:studentID/:positionID', studentApplicationController.verifyStudentApplication);

// Ruta para obtener postulaciones por ID de alumno
router.get('/student/:studentID', studentApplicationController.getApplicationsByStudentID);

// Ruta para rechazar una postulación
router.post('/reject', studentApplicationController.rejectApplication);

// Ruta para aceptar una postulación
router.post('/accept', studentApplicationController.acceptApplication);

// Ruta para registrar una nueva postulación con subida de archivo a FTP
router.post('/register', upload.single('file'), studentApplicationController.registerApplication);

// Obtener todas las postulaciones recibidas por una entidad
router.get('/company/:companyID', studentApplicationController.getApplicationsByCompanyID);

module.exports = router;
