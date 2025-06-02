const express = require('express');
const router = express.Router();
const studentApplicationController = require('../controllers/StudentApplicationController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const documentUpload = require('../middlewares/DocumentUpload'); 
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

// Ruta para obtener aplicaciones por vacante ID
router.get(
  '/position/:positionID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByPositionID
);


// Ruta para obtener nombre y URL de la carta de presentación por ID de postulación
router.get(
  '/cover-letter/:id',
  authMiddleware,
  checkUserTypeOrRole(['student', 'company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getCoverLetterByID
);


// Ruta para verificar si un alumno ya ha aplicado a una vacante
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  studentApplicationController.getApplicationsByLoggedStudent
);

// Obtener todas las postulaciones de la empresa autenticada
router.get(
  '/my-company',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.getApplicationsByMyCompany
);

// Ruta para obtener postulaciones por ID de alumno
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
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
  studentApplicationController.getApplicationsByCompanyID
);

// Actualizar una postulación (aceptar o rechazar)
router.patch(
  '/update/:applicationID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  studentApplicationController.patchApplicationController
);

// La empresa actualiza el estado de una postulación que le pertenece a Rechazado o Preaceptado
router.patch(
  '/status/:applicationID',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.updateApplicationStatusByCompany
);

// Obtener todas las postulaciones por status
router.get(
  '/status/:status',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByStatus
);


module.exports = router;
