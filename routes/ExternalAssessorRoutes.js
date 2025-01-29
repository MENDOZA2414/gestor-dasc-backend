// Rutas para gestionar asesores externos.

const express = require('express');
const router = express.Router();
const externalAssessorController = require('../controllers/ExternalAssessorController');

// Registrar un asesor externo
router.post('/register', externalAssessorController.registerExternalAssessorController);

// Obtener todos los asesores externos
router.get('/all', externalAssessorController.getAllExternalAssessorsController);

// Obtener un asesor externo por ID
router.get('/:id', externalAssessorController.getExternalAssessorByIDController);

// Obtener asesores externos por empresa
router.get('/company/:companyID', externalAssessorController.getExternalAssessorsByCompanyIDController);

// Actualizar un asesor externo
router.put('/:externalAssessorID', externalAssessorController.updateExternalAssessorController);

// Eliminar un asesor externo
router.delete('/:externalAssessorID', externalAssessorController.deleteExternalAssessorController);

module.exports = router;
