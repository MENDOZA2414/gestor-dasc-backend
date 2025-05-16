const express = require('express');
const router = express.Router();
const studentApplicationController = require('../controllers/StudentApplicationController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const documentUpload = require('../middlewares/DocumentUpload'); 

// Ruta para obtener aplicaciones por vacante ID
router.get(
  '/position/:positionID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['company']),
  studentApplicationController.getApplicationsByPositionID
);

// Ruta para obtener nombre y URL de la carta de presentación por ID de postulación
router.get(
  '/cover-letter/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'company']),
  studentApplicationController.getCoverLetterByID
);

// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get(
  '/check/:studentID/:positionID',
  authMiddleware,
  checkUserType(['student']),
  studentApplicationController.verifyStudentApplication
);

// Ruta para obtener postulaciones por ID de alumno
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student']),
  studentApplicationController.getApplicationsByStudentID
);

// Ruta para registrar una nueva postulación con subida de archivo a FTP
router.post(
  '/register',
  authMiddleware,
  checkUserType(['student']),
  documentUpload,
  studentApplicationController.registerApplication
);

// Obtener todas las postulaciones recibidas por una entidad
router.get(
  '/company/:companyID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['company']),
  studentApplicationController.getApplicationsByCompanyID
);

// Actualizar una postulación (aceptar o rechazar)
router.patch(
  '/update/:applicationID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['internalAssessor']),
  studentApplicationController.patchApplicationController
);

module.exports = router;
