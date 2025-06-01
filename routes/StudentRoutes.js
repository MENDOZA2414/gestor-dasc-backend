const express = require('express');
const router = express.Router();

const studentController = require('../controllers/StudentController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

// ──────── Rutas públicas ────────

// Registro de nuevo alumno (pública)
router.post(
  '/register',
  profileUploadMiddleware,
  studentController.registerStudentController
);

// ──────── Rutas protegidas ────────

// Obtener todos los alumnos (Admin/SuperAdmin)
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getAllStudents
);

// Obtener cantidad total de alumnos
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.countStudents
);

// Obtener alumnos asignados al asesor autenticado
router.get(
  '/by-assessor',
  authMiddleware,
  checkUserType(['internalAssessor']),
  studentController.getStudentsByLoggedAssessor
);

// Obtener alumnos por ID de asesor interno
router.get(
  '/assessor/:internalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByInternalAssessorID
);

// Obtener alumnos filtrados por estatus y asesor
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatusAndAssessorID
);

// Obtener alumnos por estatus general
router.get(
  '/by-student-status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatus
);

// Obtener el perfil del estudiante autenticado
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  studentController.getStudentProfile
);

// Obtener alumno por número de control
router.get(
  '/:controlNumber',
  authMiddleware,
  studentController.getStudentByControlNumber
);

// Actualizar alumno por número de control
router.patch(
  '/:controlNumber',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.patchStudentController
);

// Reasignar asesor interno a un alumno
router.patch(
  '/:controlNumber/assessor',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.reassignAssessorController
);

// Cambiar estatus del alumno (Aceptado, Rechazado, Pendiente)
router.patch(
  '/:controlNumber/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.updateStatus
);

// Eliminar lógicamente un alumno por número de control
router.delete(
  '/:controlNumber',
  authMiddleware,
  checkRole(['SuperAdmin']),
  studentController.deleteStudentByControlNumber
);

module.exports = router;
