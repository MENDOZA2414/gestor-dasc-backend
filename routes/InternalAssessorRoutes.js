const express = require('express');
const router = express.Router();

const internalAssessorController = require('../controllers/InternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

// ──────── Rutas públicas ────────

// Obtener todos los asesores internos (visible para alumnos al registrarse)
router.get('/', internalAssessorController.getAllInternalAssessors);

// ──────── Rutas protegidas ────────

// Obtener asesor interno por ID (para Admin, SuperAdmin o dueño del perfil)
router.get(
  '/:id',
  authMiddleware,
  internalAssessorController.getInternalAssessorByID
);

// Contar número total de asesores internos
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.countInternalAssessors
);

// Registrar un nuevo asesor interno
router.post(
  '/register',
  profileUploadMiddleware,
  internalAssessorController.registerInternalAssessorController
);

// Actualizar parcialmente los datos de un asesor interno
router.patch(
  '/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.patchInternalAssessorController
);

// Cambiar el estatus del asesor (Aceptado, Rechazado, Pendiente)
router.patch(
  '/:userID/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  internalAssessorController.updatestatus
);

// Eliminar lógicamente un asesor interno
router.delete(
  '/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  internalAssessorController.deleteInternalAssessor
);

module.exports = router;
