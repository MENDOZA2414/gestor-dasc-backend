const AsesorInterno = require('../models/asesorInterno');

// Registrar un asesor interno
const registrarAsesorInternoController = async (req, res) => {
    try {
        const asesorData = req.body;
        const result = await AsesorInterno.registrarAsesorInterno(asesorData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el asesor interno:', error.message);
        res.status(500).send({ message: 'Error al registrar el asesor interno', error: error.message });
    }
};

// Obtener un asesor interno por ID
const obtenerAsesorInternoPorID = async (req, res) => {
    try {
        const asesorInternoID = req.params.id;
        const asesor = await AsesorInterno.obtenerAsesorInternoPorID(asesorInternoID);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al obtener el asesor interno:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor interno' });
    }
};

// Obtener todos los asesores internos
const obtenerTodosLosAsesoresInternos = async (req, res) => {
    try {
        const asesores = await AsesorInterno.obtenerTodosLosAsesoresInternos();
        res.status(200).json(asesores);
    } catch (error) {
        console.error('Error al obtener los asesores internos:', error.message);
        res.status(500).json({ message: 'Error al obtener los asesores internos' });
    }
};

// Contar asesores internos (prueba de conexión)
const contarAsesoresInternos = async (req, res) => {
    try {
        const count = await AsesorInterno.contarAsesoresInternos();
        res.status(200).json({ message: 'Consulta exitosa', count });
    } catch (error) {
        console.error('Error en la consulta de prueba:', error.message);
        res.status(500).json({ message: 'Error en el servidor ejecutando la consulta de prueba', error: error.message });
    }
};

module.exports = {
    registrarAsesorInternoController,
    obtenerAsesorInternoPorID,
    obtenerTodosLosAsesoresInternos,
    contarAsesoresInternos
};
