const express = require('express');
const router = express.Router();

const studentApplicationController = require('../controllers/StudentApplicationController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const documentUpload = require('../middlewares/DocumentUpload');

// ──────── Rutas protegidas (GET) ────────

// Obtener postulaciones del alumno autenticado (¿ya ha aplicado a una vacante?)
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  studentApplicationController.getApplicationsByLoggedStudent
);

// Obtener todas las postulaciones recibidas por la empresa autenticada
router.get(
  '/my-company',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.getApplicationsByMyCompany
);

// Obtener postulaciones por ID de empresa (Admin/SuperAdmin)
router.get(
  '/company/:companyID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByCompanyID
);

// Obtener postulaciones por ID de vacante
router.get(
  '/position/:positionID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByPositionID
);

// Obtener postulaciones por ID de alumno
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByStudentID
);

// Obtener postulaciones filtradas por estatus
router.get(
  '/status/:status',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getApplicationsByStatus
);

// Obtener nombre y URL de la carta de presentación por ID de postulación
router.get(
  '/cover-letter/:id',
  authMiddleware,
  checkUserTypeOrRole(['student', 'company'], ['Admin', 'SuperAdmin']),
  studentApplicationController.getCoverLetterByID
);

// ──────── Rutas protegidas (POST) ────────

// Registrar una nueva postulación con carta de presentación (solo alumnos)
router.post(
  '/register',
  authMiddleware,
  checkUserType(['student']),
  documentUpload,
  studentApplicationController.registerApplication
);

// ──────── Rutas protegidas (PATCH) ────────

// Actualizar una postulación por parte del asesor interno o un administrador
router.patch(
  '/update/:applicationID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  studentApplicationController.patchApplicationController
);

// Cambiar estatus de la postulación (Rechazado o Preaceptado) por parte de la empresa propietaria
router.patch(
  '/status/:applicationID',
  authMiddleware,
  checkUserType(['company']),
  studentApplicationController.updateApplicationStatusByCompany
);

module.exports = router;
