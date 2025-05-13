const express = require('express');
const router = express.Router();
const internalAssessorController = require('../controllers/InternalAssessorController');

// Ruta para registrar un asesor interno
router.post('/register', internalAssessorController.registerInternalAssessorController);

// Ruta para probar la conexión y contar el número de asesores internos
router.get('/testConnection', internalAssessorController.countInternalAssessors);

// Ruta para obtener un asesor interno por ID
router.get('/:id', internalAssessorController.getInternalAssessorByID);

// Ruta para obtener todos los asesores internos
router.get('/', internalAssessorController.getAllInternalAssessors);

// Ruta para eliminar un asesor interno por ID (eliminación lógica)
router.delete('/:id', internalAssessorController.deleteInternalAssessor);

// Ruta para actualizar un asesor interno por ID
router.patch('/:id', internalAssessorController.patchInternalAssessorController);

module.exports = router;
