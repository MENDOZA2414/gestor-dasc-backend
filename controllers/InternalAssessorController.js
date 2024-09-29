const InternalAssessor = require('../models/InternalAssessor');

// Registrar un asesor interno
const registerInternalAssessorController = async (req, res) => {
    try {
        const assessorData = req.body;
        const result = await InternalAssessor.registerInternalAssessor(assessorData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el asesor interno:', error.message);
        res.status(500).send({ message: 'Error al registrar el asesor interno', error: error.message });
    }
};

// Obtener un asesor interno por ID
const getInternalAssessorByID = async (req, res) => {
    try {
        const internalAssessorID = req.params.id;
        const assessor = await InternalAssessor.getInternalAssessorByID(internalAssessorID);
        res.status(200).json(assessor);
    } catch (error) {
        console.error('Error al obtener el asesor interno:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor interno' });
    }
};

// Obtener todos los asesores internos
const getAllInternalAssessors = async (req, res) => {
    try {
        const assessors = await InternalAssessor.getAllInternalAssessors();
        res.status(200).json(assessors);
    } catch (error) {
        console.error('Error al obtener los asesores internos:', error.message);
        res.status(500).json({ message: 'Error al obtener los asesores internos' });
    }
};

// Contar asesores internos (prueba de conexión)
const countInternalAssessors = async (req, res) => {
    try {
        const count = await InternalAssessor.countInternalAssessors();
        res.status(200).json({ message: 'Consulta exitosa', count });
    } catch (error) {
        console.error('Error en la consulta de prueba:', error.message);
        res.status(500).json({ message: 'Error en el servidor ejecutando la consulta de prueba', error: error.message });
    }
};

module.exports = {
    registerInternalAssessorController,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors
};
