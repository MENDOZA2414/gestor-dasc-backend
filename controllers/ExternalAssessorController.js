// Controlador para gestionar las operaciones de asesores externos

const ExternalAssessor = require('../models/ExternalAssessor');

// Registrar un asesor externo
const registerExternalAssessorController = async (req, res) => {
    try {
        const assessorData = req.body;

        if (!assessorData || Object.keys(assessorData).length === 0) {
            return res.status(400).json({ message: 'Datos del asesor externo requeridos' });
        }

        const result = await ExternalAssessor.registerExternalAssessor(assessorData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error en registro:', error.message);
        res.status(500).json({ message: 'No se pudo registrar el asesor externo' });
    }
};

// Obtener un asesor externo por ID
const getExternalAssessorByIDController = async (req, res) => {
    try {
        const externalAssessorID = req.params.id;

        if (!externalAssessorID) {
            return res.status(400).json({ message: 'ID del asesor externo requerido' });
        }

        const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);
        res.status(200).json(assessor);
    } catch (error) {
        console.error('Error en consulta por ID:', error.message);
        res.status(500).json({ message: 'No se pudo obtener el asesor externo' });
    }
};

// Obtener todos los asesores externos
const getAllExternalAssessorsController = async (req, res) => {
    try {
        const assessors = await ExternalAssessor.getAllExternalAssessors();
        res.status(200).json(assessors);
    } catch (error) {
        console.error('Error en consulta general:', error.message);
        res.status(500).json({ message: 'No se pudo obtener la lista de asesores externos' });
    }
};

// Obtener asesores externos por empresa
const getExternalAssessorsByCompanyIDController = async (req, res) => {
    try {
        const { companyID } = req.params;

        if (!companyID) {
            return res.status(400).json({ message: 'ID de la empresa requerido' });
        }

        const assessors = await ExternalAssessor.getExternalAssessorsByCompanyID(companyID);
        res.status(200).json(assessors);
    } catch (error) {
        console.error('Error en consulta por empresa:', error.message);
        res.status(500).json({ message: 'No se pudieron obtener los asesores externos por empresa' });
    }
};

// Actualizar un asesor externo
const updateExternalAssessorController = async (req, res) => {
    try {
        const { externalAssessorID } = req.params;
        const updateData = req.body;

        if (!externalAssessorID) {
            return res.status(400).json({ message: 'ID del asesor externo requerido' });
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Datos de actualización requeridos' });
        }

        const result = await ExternalAssessor.updateExternalAssessor(externalAssessorID, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en actualización:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar el asesor externo' });
    }
};

// Eliminar un asesor externo
const deleteExternalAssessorController = async (req, res) => {
    try {
        const { externalAssessorID } = req.params;

        if (!externalAssessorID) {
            return res.status(400).json({ message: 'ID del asesor externo requerido' });
        }

        const result = await ExternalAssessor.deleteExternalAssessor(externalAssessorID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en eliminación:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar el asesor externo' });
    }
};

module.exports = {
    registerExternalAssessorController,
    getExternalAssessorByIDController,
    getAllExternalAssessorsController,
    getExternalAssessorsByCompanyIDController,
    updateExternalAssessorController,
    deleteExternalAssessorController,
};
