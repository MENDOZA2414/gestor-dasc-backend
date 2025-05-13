const InternalAssessor = require('../models/InternalAssessor');

// Registrar un asesor interno
const registerInternalAssessorController = async (req, res) => {
    try {
        const assessorData = {
            ...req.body,
            profilePhotoName: req.generatedFileName || null,
            profilePhotoBuffer: req.bufferFile || null
        };

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

// Eliminar un asesor interno por ID (eliminación lógica)
const deleteInternalAssessor = async (req, res) => {
    try {
        const internalAssessorID = req.params.id;
        const result = await InternalAssessor.deleteInternalAssessor(internalAssessorID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar el asesor interno:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar el asesor interno', error: error.message });
    }
};

// Actualizar un asesor interno por ID
const patchInternalAssessorController = async (req, res) => {
    try {
        const internalAssessorID = req.params.id;
        const updateData = req.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const result = await InternalAssessor.patchInternalAssessor(internalAssessorID, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al actualizar parcialmente el asesor interno:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar el asesor interno', error: error.message });
    }
};

module.exports = {
    registerInternalAssessorController,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors,
    deleteInternalAssessor,
    patchInternalAssessorController
};
