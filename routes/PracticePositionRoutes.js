const express = require('express');
const router = express.Router();
const practicePositionController = require('../controllers/PracticePositionController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

// Ruta para obtener las vacantes de práctica por ID de entidad
router.get(
  '/entidad/:entidadID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.getPositionsByCompanyID
);

// Obtener todas las vacantes prácticas
router.get(
  '/all/:page/:limit',
  authMiddleware,
  practicePositionController.getAllPositions
);

// Obtener vacantes por estatus
router.get(
  '/',
  authMiddleware,
  practicePositionController.getPositionsByStatus
);

// Ruta para obtener una vacante de práctica por ID
router.get(
  '/:id',
  authMiddleware,
  practicePositionController.getPositionByID
);

// Ruta para crear una nueva vacante de práctica
router.post(
  '/create',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  practicePositionController.createPosition
);

// Cambiar el estatus de aceptacióon o rechazo de una vacante
router.patch(
  '/status/:id',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  practicePositionController.patchPositionStatus
);

// Ruta para actualizar parcialmente una vacante
router.patch(
  '/:id',
  authMiddleware,
  practicePositionController.patchPositionController
);

// Eliminación lógica controlada de vacante y opcionalmente de sus postulaciones
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  practicePositionController.deletePositionControlled
);

module.exports = router;
