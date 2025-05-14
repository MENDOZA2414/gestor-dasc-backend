// Rutas para gestionar asesores externos.

const express = require('express');
const router = express.Router();
const externalAssessorController = require('../controllers/ExternalAssessorController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');

// Registrar un asesor externo
router.post('/register', profileUploadMiddleware, externalAssessorController.registerExternalAssessorController);

// Obtener todos los asesores externos
router.get('/all', externalAssessorController.getAllExternalAssessorsController);

// Obtener un asesor externo por ID
router.get('/:id', externalAssessorController.getExternalAssessorByIDController);

// Obtener asesores externos por empresa
router.get('/company/:companyID', externalAssessorController.getExternalAssessorsByCompanyIDController);

// Actualizar un asesor externo
router.patch('/:externalAssessorID', externalAssessorController.patchExternalAssessorController);

// Eliminar un asesor externo
router.delete('/:externalAssessorID', externalAssessorController.deleteExternalAssessorController);

module.exports = router;
