const Alumno = require('../models/alumno');

// Obtener un alumno por número de control
exports.obtenerAlumnoPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const alumno = await Alumno.obtenerAlumnoPorNumControl(numControl);
        res.status(200).json(alumno);
    } catch (error) {
        console.error('Error al obtener el alumno:', error.message);
        res.status(500).json({ message: 'Error al obtener el alumno' });
    }
};

// Obtener imagen de perfil por número de control
exports.obtenerImagenPerfilPorNumControl = async (req, res) => {
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
exports.obtenerAlumnosPorAsesorID = async (req, res) => {
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
exports.obtenerTodosLosAlumnos = async (req, res) => {
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
exports.obtenerAlumnosPorEstatusYAsesorID = async (req, res) => {
    try {
        const { estatus, asesorInternoID } = req.query;
        const alumnos = await Alumno.obtenerAlumnosPorEstatusYAsesorID(estatus, asesorInternoID);
        res.status(200).json(alumnos);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Eliminar un alumno por número de control
exports.eliminarPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const resultado = await Alumno.eliminarPorNumControl(numControl);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar el alumno:', error.message);
        res.status(500).json({ message: 'Error al eliminar el alumno' });
    }
};
