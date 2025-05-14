const express = require('express');
const router = express.Router();
const practicePositionController = require('../controllers/PracticePositionController');

// Ruta para obtener las vacantes de práctica por ID de entidad
router.get('/entidad/:entidadID', practicePositionController.getPositionsByCompanyID);

// Obtener todas las vacantes prácticas
router.get('/all/:page/:limit', practicePositionController.getAllPositions);

// Obtener vacantes por estatus
router.get('/', practicePositionController.getPositionsByStatus);

// Ruta para obtener una vacante de práctica por ID
router.get('/:id', practicePositionController.getPositionByID);

// Ruta para crear una nueva vacante de práctica
router.post('/create', practicePositionController.createPosition);

// Ruta para actualizar parcialmente una vacante
router.patch('/:id', practicePositionController.patchPositionController);

// Eliminar vacante
router.delete('/:practicePositionID', practicePositionController.deletePosition);

// Eliminar una vacante junto con sus postulaciones
router.delete('/eliminar/:id', practicePositionController.deletePositionAndApplications);

module.exports = router;
