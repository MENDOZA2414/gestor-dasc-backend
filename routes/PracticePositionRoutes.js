const express = require('express');
const router = express.Router();
const practicePositionController = require('../controllers/PracticePositionController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

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
  checkUserType(['company']),
  practicePositionController.createPosition
);

// Ruta para actualizar parcialmente una vacante
router.patch(
  '/:id',
  authMiddleware,
  practicePositionController.patchPositionController
);

// Eliminar vacante
router.delete(
  '/:practicePositionID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  practicePositionController.deletePosition
);

// Eliminar una vacante junto con sus postulaciones
router.delete(
  '/eliminar/:id',
  authMiddleware,
  checkRole(['SuperAdmin']),
  practicePositionController.deletePositionAndApplications
);

module.exports = router;
