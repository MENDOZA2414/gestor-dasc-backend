const Student = require('../models/Student');
const { registerStudent } = require('../models/Student');

// Controlador para registrar un alumno
const registerStudentController = async (req, res) => {
    try {
        const studentData = req.body;
        const result = await registerStudent(studentData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el alumno:', error.message);

        // Verificar si es un error de validación y devolver un 400 Bad Request
        if (error.message.includes('El número de control') || 
            error.message.includes('El email ya está registrado') ||
            error.message.includes('El número de teléfono')) {
            return res.status(400).send({ message: error.message });
        }

        // Si es un error interno
        res.status(500).send({ message: 'Error al registrar el alumno', error: error.message });
    }
};


// Obtener un alumno por controlNumber
const getStudentByControlNumber = async (req, res) => {
    try {
        const controlNumber = req.params.controlNumber;
        const student = await Student.getStudentByControlNumber(controlNumber);
        if (!student) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error al obtener el alumno:', error.message);
        res.status(500).json({ message: 'Error al obtener el alumno' });
    }
};


// Obtener alumnos por ID de asesor
const getStudentsByInternalAssessorID = async (req, res) => {
    try {
        const internalAssessorID = req.params.internalAssessorID;
        const students = await Student.getStudentsByInternalAssessorID(internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Obtener todos los alumnos por ID de asesor interno
const getAllStudents = async (req, res) => {
    try {
        const internalAssessorID = req.query.internalAssessorID;
        const students = await Student.getAllStudents(internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener todos los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener todos los alumnos' });
    }
};

// Contar alumnos en el sistema
const countStudents = async (req, res) => {
    try {
        const totalStudents = await Student.countStudents();
        res.status(200).json({ totalStudents });
    } catch (error) {
        console.error('Error al contar los alumnos:', error.message);
        res.status(500).json({ message: 'Error al contar los alumnos' });
    }
};

// Obtener alumnos por estatus y ID de asesor interno
const getStudentsByStatusAndAssessorID = async (req, res) => {
    try {
        const { status, internalAssessorID } = req.query;
        const students = await Student.getStudentsByStatusAndAssessorID(status, internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Eliminar un alumno por controlNumber
const deleteStudentByControlNumber = async (req, res) => {
    try {
        const controlNumber = req.params.controlNumber;
        const result = await Student.deleteStudentByControlNumber(controlNumber);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar el alumno:', error.message);
        res.status(500).json({ message: 'Error al eliminar el alumno' });
    }
};

// Exportar todas las funciones
module.exports = {
    registerStudentController,
    getStudentByControlNumber,
    getStudentsByInternalAssessorID,
    getAllStudents,
    getStudentsByStatusAndAssessorID,
    countStudents,
    deleteStudentByControlNumber
};
