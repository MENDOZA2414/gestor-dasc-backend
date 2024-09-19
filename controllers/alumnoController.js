const Alumno = require('../models/alumno');
const { registrarAlumno } = require('../models/alumno');

// Controlador para registrar un alumno
const registrarAlumnoController = async (req, res) => {
    try {
        const alumnoData = req.body;
        const result = await registrarAlumno(alumnoData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el alumno:', error.message);
        res.status(500).send({ message: 'Error al registrar el alumno', error: error.message });
    }
};

// Obtener un alumno por numControl
const obtenerAlumnoPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const alumno = await Alumno.obtenerAlumnoPorNumControl(numControl);
        res.status(200).json(alumno);
    } catch (error) {
        console.error('Error al obtener el alumno:', error.message);
        res.status(500).json({ message: 'Error al obtener el alumno' });
    }
};

// Obtener imagen de perfil por numControl
const obtenerImagenPerfilPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const imagenPerfil = await Alumno.obtenerImagenPerfilPorNumControl(numControl);
        res.type('image/jpeg').send(imagenPerfil);
    } catch (error) {
        console.error('Error al obtener la imagen de perfil:', error.message);
        res.status(500).json({ message: 'Error al obtener la imagen de perfil' });
    }
};

// Obtener alumnos por ID de asesor
const obtenerAlumnosPorAsesorID = async (req, res) => {
    try {
        const asesorID = req.params.asesorID;
        const alumnos = await Alumno.obtenerAlumnosPorAsesorID(asesorID);
        res.status(200).json(alumnos);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Obtener todos los alumnos por ID de asesor interno
const obtenerTodosLosAlumnos = async (req, res) => {
    try {
        const asesorInternoID = req.query.asesorInternoID;
        const alumnos = await Alumno.obtenerTodosLosAlumnos(asesorInternoID);
        res.status(200).json(alumnos);
    } catch (error) {
        console.error('Error al obtener todos los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener todos los alumnos' });
    }
};

// Obtener alumnos por estatus y ID de asesor interno
const obtenerAlumnosPorEstatusYAsesorID = async (req, res) => {
    try {
        const { estatus, asesorInternoID } = req.query;
        const alumnos = await Alumno.obtenerAlumnosPorEstatusYAsesorID(estatus, asesorInternoID);
        res.status(200).json(alumnos);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Eliminar un alumno por numControl
const eliminarPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const resultado = await Alumno.eliminarPorNumControl(numControl);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar el alumno:', error.message);
        res.status(500).json({ message: 'Error al eliminar el alumno' });
    }
};

// Exportar todas las funciones
module.exports = {
    registrarAlumnoController,
    obtenerAlumnoPorNumControl,
    obtenerImagenPerfilPorNumControl,
    obtenerAlumnosPorAsesorID,
    obtenerTodosLosAlumnos,
    obtenerAlumnosPorEstatusYAsesorID,
    eliminarPorNumControl
};
