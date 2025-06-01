const express = require('express');
const router = express.Router();
const professionalPracticeController = require('../controllers/ProfessionalPracticeController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');

// Obtener todas las prácticas con filtros opcionales (uso administrativo)
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.getAllPractices
);

// Obtener la práctica profesional registrada de un estudiante
router.get(
  '/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['student', 'internalAssessor']),
  professionalPracticeController.getPracticeByStudentID
);

// Obtener todas las prácticas asignadas a una empresa
router.get(
  '/company/:companyID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['company']),
  professionalPracticeController.getPracticesByCompanyID
);

// Obtener todas las prácticas asignadas a un asesor externo
router.get(
  '/external-assessor/:externalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['externalAssessor']),
  professionalPracticeController.getPracticesByExternalAssessorID
);

// Obtener todas las prácticas asignadas a un asesor interno
router.get(
  '/internal-assessor/:internalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['internalAssessor']),
  professionalPracticeController.getPracticesByInternalAssessorID
);

// Obtener la práctica de un alumno específico asignado a un asesor interno
router.get(
  '/internal-assessor/:internalAssessorID/student/:studentID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['internalAssessor']),
  professionalPracticeController.getStudentPracticeByAssessor
);

// Obtener todos los estudiantes asignados a un asesor externo
router.get(
  '/students/external-assessor/:externalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['externalAssessor']),
  professionalPracticeController.getStudentsByExternalAssessorID
);

// Obtener todos los estudiantes que están haciendo prácticas en una empresa específica
router.get(
  '/students/company/:companyID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  checkUserType(['company']),
  professionalPracticeController.getStudentsByCompanyID
);

// Obtener el top 5 de entidades más solicitadas por alumnos (para dashboard)
router.get(
  '/stats/top-companies',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.getTopCompaniesStats
);

// Actualizar una práctica profesional
router.patch(
  '/:practiceID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  professionalPracticeController.patchPractice
);

// Eliminar lógicamente una práctica profesional
router.delete(
  '/:practiceID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  professionalPracticeController.deletePractice
);

module.exports = router;
