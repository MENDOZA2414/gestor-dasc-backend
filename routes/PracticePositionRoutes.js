const express = require('express');
const router = express.Router();

const practicePositionController = require('../controllers/PracticePositionController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

// ──────── Rutas protegidas ────────

// Crear una nueva vacante de práctica
router.post(
  '/create',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  practicePositionController.createPosition
);

// Obtener todas las vacantes (paginadas)
router.get(
  '/all/:page/:limit',
  authMiddleware,
  practicePositionController.getAllPositions
);

// Obtener vacantes filtradas por estatus
router.get(
  '/',
  authMiddleware,
  practicePositionController.getPositionsByStatus
);

// Obtener vacantes por ID de entidad receptora
router.get(
  '/entidad/:entidadID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.getPositionsByCompanyID
);

// Obtener vacante por ID
router.get(
  '/:id',
  authMiddleware,
  practicePositionController.getPositionByID
);

// Actualizar parcialmente una vacante por ID
router.patch(
  '/:id',
  authMiddleware,
  practicePositionController.patchPositionController
);

// Cambiar estatus (aceptar, rechazar) de una vacante por ID
router.patch(
  '/status/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.patchPositionStatus
);

// Eliminación lógica controlada de vacante y sus postulaciones (opcional)
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  practicePositionController.deletePositionControlled
);

module.exports = router;
