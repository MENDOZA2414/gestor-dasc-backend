const express = require('express');
const router = express.Router();
const studentController = require('../controllers/StudentController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');

// Ruta para registrar un alumno
router.post('/register', profileUploadMiddleware, studentController.registerStudentController);

// Ruta para contar todos los alumnos
router.get('/count', studentController.countStudents);

// Ruta para obtener todos los alumnos asignados a un asesor interno
router.get('/all', studentController.getAllStudents);

// Ruta para obtener los alumnos asignados a un asesor interno
router.get('/assessor/:internalAssessorID', studentController.getStudentsByInternalAssessorID);

// Ruta para obtener alumnos por estatus y ID de asesor interno
router.get('/', studentController.getStudentsByStatusAndAssessorID);

// Ruta para obtener un alumno por controlNumber
router.get('/:controlNumber', studentController.getStudentByControlNumber);

// Ruta para eliminar un alumno por controlNumber
router.delete('/:controlNumber', studentController.deleteStudentByControlNumber);

module.exports = router;
