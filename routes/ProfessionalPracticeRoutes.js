const express = require('express');
const router = express.Router();
const professionalPracticeController = require('../controllers/ProfessionalPracticeController');

// Obtener todas las prácticas con filtros opcionales (uso administrativo)
router.get('/', professionalPracticeController.getAllPractices);

// Obtener la práctica profesional registrada de un estudiante
router.get('/student/:studentID', professionalPracticeController.getPracticeByStudentID);

// Obtener todas las prácticas asignadas a una empresa
router.get('/company/:companyID', professionalPracticeController.getPracticesByCompanyID);

// Obtener todas las prácticas asignadas a un asesor externo
router.get('/external-assessor/:externalAssessorID', professionalPracticeController.getPracticesByExternalAssessorID);

// Obtener todas las prácticas asignadas a un asesor interno
router.get('/internal-assessor/:internalAssessorID', professionalPracticeController.getPracticesByInternalAssessorID);

// Obtener la práctica de un alumno específico asignado a un asesor interno
router.get('/internal-assessor/:internalAssessorID/student/:studentID', professionalPracticeController.getStudentPracticeByAssessor);

// Obtener todos los estudiantes asignados a un asesor externo
router.get('/students/external-assessor/:externalAssessorID', professionalPracticeController.getStudentsByExternalAssessorID);

// Obtener todos los estudiantes que están haciendo prácticas en una empresa específica
router.get('/students/company/:companyID', professionalPracticeController.getStudentsByCompanyID);

// Actualizar una práctica profesional
router.patch('/:practiceID', professionalPracticeController.patchPractice);

// Eliminar lógicamente una práctica profesional
router.delete('/:practiceID', professionalPracticeController.deletePractice);

module.exports = router;
