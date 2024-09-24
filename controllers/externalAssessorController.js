const ExternalAssessor = require('../models/externalAssessor');

// Controlador para registrar un asesor externo
const registerExternalAssessorController = async (req, res) => {
    try {
        const assessorData = req.body;
        const result = await ExternalAssessor.registerExternalAssessor(assessorData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el asesor externo:', error.message);
        res.status(500).send({ message: 'Error al registrar el asesor externo', error: error.message });
    }
};

// Controlador para obtener un asesor externo por ID
const getExternalAssessorByID = async (req, res) => {
    try {
        const externalAssessorID = req.params.id;
        const assessor = await ExternalAssessor.getExternalAssessorByID(externalAssessorID);
        res.status(200).json(assessor);
    } catch (error) {
        console.error('Error al obtener el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor externo' });
    }
};

// Exportar los controladores
module.exports = {
    registerExternalAssessorController,
    getExternalAssessorByID
};
