const express = require('express');
const router = express.Router();
const studentApplicationController = require('../controllers/StudentApplicationController');
const documentUpload = require('../middlewares/DocumentUpload');


// Ruta para obtener aplicaciones por vacante ID
router.get('/position/:positionID', studentApplicationController.getApplicationsByPositionID);

// Ruta para obtener nombre y URL de la carta de presentación por ID de postulación
router.get('/cover-letter/:id', studentApplicationController.getCoverLetterByID);

// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get('/check/:studentID/:positionID', studentApplicationController.verifyStudentApplication);

// Ruta para obtener postulaciones por ID de alumno
router.get('/student/:studentID', studentApplicationController.getApplicationsByStudentID);


// Ruta para registrar una nueva postulación con subida de archivo a FTP
router.post('/register', documentUpload, studentApplicationController.registerApplication);

// Obtener todas las postulaciones recibidas por una entidad
router.get('/company/:companyID', studentApplicationController.getApplicationsByCompanyID);

// Actualizar una postulación (aceptar o rechazar)
router.patch('/update/:applicationID', studentApplicationController.patchApplicationController);

module.exports = router;
