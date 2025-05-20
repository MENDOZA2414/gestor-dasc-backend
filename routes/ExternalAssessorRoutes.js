const express = require('express');
const router = express.Router();
const externalAssessorController = require('../controllers/ExternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

// Registrar un asesor externo
router.post(
  '/register',
  authMiddleware,
  checkUserType(['company']),
  profileUploadMiddleware,
  externalAssessorController.registerExternalAssessorController
);

// Obtener todos los asesores externos
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  externalAssessorController.getAllExternalAssessorsController
);

// Ruta para contar asesores externos
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  externalAssessorController.countExternalAssessorsController
);

// Obtener un asesor externo por ID
router.get(
  '/:id',
  authMiddleware,
  externalAssessorController.getExternalAssessorByIDController
);

// Obtener asesores externos por empresa
router.get(
  '/company/:companyID',
  authMiddleware,
  externalAssessorController.getExternalAssessorsByCompanyIDController
);

// Actualizar un asesor externo
router.patch(
  '/:externalAssessorID',
  authMiddleware,
  externalAssessorController.patchExternalAssessorController
);

// Eliminar un asesor externo
router.delete(
  '/:externalAssessorID',
  authMiddleware,
  externalAssessorController.deleteExternalAssessorController
);

module.exports = router;
