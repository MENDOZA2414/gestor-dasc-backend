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

// Obtener la práctica profesional del estudiante autenticado
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  professionalPracticeController.getPracticeByLoggedStudent
);

// Obtener el progreso de la práctica profesional del estudiante autenticado
router.get(
  '/progress/me',
  authMiddleware,
  checkUserType(['student']),
  professionalPracticeController.getMyPracticeProgress
);

// Obtener la práctica profesional registrada de un estudiante (Admin o Asesor Interno)
router.get(
  '/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticeByStudentID
);

// Obtener todas las prácticas registradas por una empresa
router.get(
  '/company/:companyID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByCompanyID
);

// Obtener todas las prácticas asignadas a un asesor externo
router.get(
  '/external-assessor/:externalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['externalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByExternalAssessorID
);

// Obtener todas las prácticas asignadas a un asesor interno
router.get(
  '/internal-assessor/:internalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getPracticesByInternalAssessorID
);

// Obtener la práctica de un alumno específico asignado a un asesor interno
router.get(
  '/internal-assessor/:internalAssessorID/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getStudentPracticeByAssessor
);

// Obtener todos los estudiantes asignados a un asesor externo
router.get(
  '/students/external-assessor/:externalAssessorID',
  authMiddleware,
  checkUserTypeOrRole(['externalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.getStudentsByExternalAssessorID
);

// Obtener todos los estudiantes que están haciendo prácticas en una empresa específica
router.get(
  '/students/company/:companyID',
  authMiddleware,
  checkUserTypeOrRole(['company'], ['Admin', 'SuperAdmin']),
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

// Actualizar el estado de una práctica profesional
router.patch(
  '/:practiceID/status',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.updatePracticeStatus
);

// Actualizar el progreso de una práctica profesional
router.patch(
  '/:practiceID/progress',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor'], ['Admin', 'SuperAdmin']),
  professionalPracticeController.updatePracticeProgress
);

// Obtener el progreso de la práctica profesional de un alumno
router.get(
  '/progress/student/:studentID',
  authMiddleware,
  checkUserTypeOrRole(
  ['student', 'internalAssessor', 'externalAssessor', 'company'],
  ['Admin', 'SuperAdmin']
  ),
  professionalPracticeController.getPracticeProgress
);

// Eliminar lógicamente una práctica profesional
router.delete(
  '/:practiceID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  professionalPracticeController.deletePractice
);

module.exports = router;
