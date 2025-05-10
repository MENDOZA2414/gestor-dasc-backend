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

// Obtener todas las prácticas (uso administrativo), con filtros opcionales
router.get('/practice/all', studentApplicationController.getAllPractices);

// Ruta para rechazar una postulación
router.post('/reject', studentApplicationController.rejectApplication);

// Ruta para aceptar una postulación
router.post('/accept', studentApplicationController.acceptApplication);

// Ruta para registrar una nueva postulación con subida de archivo a FTP
router.post('/register', upload.single('file'), studentApplicationController.registerApplication);

// Obtener todas las postulaciones recibidas por una entidad
router.get('/company/:companyID', studentApplicationController.getApplicationsByCompanyID);

// Obtener la práctica profesional registrada de un estudiante
router.get('/practice/:studentID', studentApplicationController.getPracticeByStudentID);

// Obtener todas las prácticas asignadas a una empresa
router.get('/practice/company/:companyID', studentApplicationController.getPracticesByCompanyID);

// Obtener todas las prácticas asignadas a un asesor externo
router.get('/practice/external-assessor/:externalAssessorID', studentApplicationController.getPracticesByExternalAssessorID);

// Obtener todas las prácticas de alumnos de un asesor interno
router.get('/practice/internal-assessor/:internalAssessorID', studentApplicationController.getPracticesByInternalAssessorID);

// Obtener la práctica de un alumno específico asignado a un asesor interno
router.get('/practice/internal-assessor/:internalAssessorID/student/:studentID', studentApplicationController.getStudentPracticeByAssessor);

// Obtener todos los estudiantes asignados a un asesor externo
router.get('/students/external-assessor/:externalAssessorID', studentApplicationController.getStudentsByExternalAssessorID);

// Obtener todos los estudiantes que están haciendo prácticas en una empresa específica
router.get('/students/company/:companyID', studentApplicationController.getStudentsByCompanyID);

module.exports = router;
