const express = require('express');
const router = express.Router();
const studentController = require('../controllers/StudentController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

// Ruta para registrar un alumno (pública)
router.post(
  '/register',
  profileUploadMiddleware,
  studentController.registerStudentController
);

// Ruta para contar todos los alumnos (solo Admin/SuperAdmin)
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.countStudents
);

// Ruta para obtener todos los alumnos
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getAllStudents
);

// Ruta para obtener los alumnos asignados a un asesor interno Autenticado
router.get(
  '/by-assessor',
  authMiddleware,
  checkUserType(['internalAssessor']),
  studentController.getStudentsByLoggedAssessor
);

// Ruta para obtener los alumnos asignados a un asesor interno
router.get(
  '/assessor/:internalAssessorID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByInternalAssessorID
);

// Ruta para obtener alumnos por estatus y ID de asesor interno
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatusAndAssessorID
);

// Ruta para obtener un alumnos por estatus
router.get(
  '/by-student-status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.getStudentsByStatus
);

// Ruta para obtener un alumno por controlNumber
router.get(
  '/:controlNumber',
  authMiddleware,
  studentController.getStudentByControlNumber
);

// Ruta para eliminar un alumno por controlNumber
router.delete(
  '/:controlNumber',
  authMiddleware,
  checkRole(['SuperAdmin']),
  studentController.deleteStudentByControlNumber
);

// Ruta para actualizar los datos de un alumno por controlNumber
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

// Cambiar el estatus del alumno (Aceptado, Rechazado, Pendiente)
router.patch(
  '/:controlNumber/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  studentController.updateStatus
);

module.exports = router;
