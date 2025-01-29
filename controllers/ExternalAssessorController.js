const ExternalAssessor = require('../models/ExternalAssessor');

// Registrar un asesor externo
const registerExternalAssessorController = async (req, res) => {
    try {
        const assessorData = req.body;
        const result = await ExternalAssessor.registerExternalAssessor(assessorData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al registrar el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al registrar el asesor externo', error: error.message });
    }
};

// Obtener un asesor externo por ID
const getExternalAssessorByIDController = async (req, res) => {
    try {
        const externalAssessorID = req.params.id;
        const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);
        res.status(200).json(assessor);
    } catch (error) {
        console.error('Error al obtener el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor externo' });
    }
};

// Obtener todos los asesores externos
const getAllExternalAssessorsController = async (req, res) => {
    try {
        const assessors = await ExternalAssessor.getAllExternalAssessors();
        res.status(200).json(assessors);
    } catch (error) {
        console.error('Error al obtener todos los asesores externos:', error.message);
        res.status(500).json({ message: 'Error al obtener todos los asesores externos' });
    }
};

// Obtener asesores externos por empresa
const getExternalAssessorsByCompanyIDController = async (req, res) => {
    try {
        const { companyID } = req.params;
        const assessors = await ExternalAssessor.getExternalAssessorsByCompanyID(companyID);
        res.status(200).json(assessors);
    } catch (error) {
        console.error('Error al obtener asesores externos por empresa:', error.message);
        res.status(500).json({ message: 'Error al obtener asesores externos por empresa' });
    }
};

// Actualizar un asesor externo
const updateExternalAssessorController = async (req, res) => {
    try {
        const { externalAssessorID } = req.params;
        const updateData = req.body;
        const result = await ExternalAssessor.updateExternalAssessor(externalAssessorID, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al actualizar el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al actualizar el asesor externo' });
    }
};

// Eliminar un asesor externo
const deleteExternalAssessorController = async (req, res) => {
    try {
        const { externalAssessorID } = req.params;
        const result = await ExternalAssessor.deleteExternalAssessor(externalAssessorID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al eliminar el asesor externo' });
    }
};

module.exports = {
    registerExternalAssessorController,
    getExternalAssessorByIDController,
    getAllExternalAssessorsController,
    getExternalAssessorsByCompanyIDController,
    updateExternalAssessorController,
    deleteExternalAssessorController
};
