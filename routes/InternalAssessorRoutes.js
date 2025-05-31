const express = require('express');
const router = express.Router();
const internalAssessorController = require('../controllers/InternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

// Ruta para registrar un asesor interno
router.post(
  '/register',
  profileUploadMiddleware,
  internalAssessorController.registerInternalAssessorController
);

// Ruta para contar el número de asesores internos
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.countInternalAssessors
);

// Ruta para obtener un asesor interno por ID
router.get(
  '/:id',
  authMiddleware,
  internalAssessorController.getInternalAssessorByID
);

// Ruta para obtener todos los asesores internos
router.get(
  '/',
  internalAssessorController.getAllInternalAssessors
);

// Ruta para eliminar un asesor interno por ID (eliminación lógica)
router.delete(
  '/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  internalAssessorController.deleteInternalAssessor
);

// Ruta para actualizar un asesor interno por ID
router.patch(
  '/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.patchInternalAssessorController
);

router.patch(
  '/:userID/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.updatestatus
);


module.exports = router;
