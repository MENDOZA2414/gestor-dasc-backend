const PracticePosition = require('../models/practicePosition');

exports.getPositionByID = async (req, res) => {
    try {
        const position = await PracticePosition.getPositionByID(req.params.id);
        res.status(200).json(position);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.getPositionsByCompanyID = async (req, res) => {
    try {
        const positions = await PracticePosition.getPositionsByCompanyID(req.params.companyID);
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.getAllPositions = async (req, res) => {
    try {
        const { page, limit } = req.params;
        const positions = await PracticePosition.getAllPositions(parseInt(page), parseInt(limit));
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.getPositionsByStatus = async (req, res) => {
    try {
        const positions = await PracticePosition.getPositionsByStatus(req.query.status);
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.createPosition = async (req, res) => {
    try {
        const position = await PracticePosition.createPosition(req.body);
        res.status(201).json({
            status: 201,
            message: 'Vacante creada con éxito',
            data: position
        });
    } catch (error) {
        console.error('Error al crear la vacante:', error.message);
        res.status(400).send({ message: error.message });
    }
};

exports.deletePosition = async (req, res) => {
    try {
        const result = await PracticePosition.deletePosition(req.params.practicePositionID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.deletePositionAndApplications = async (req, res) => {
    try {
        const result = await PracticePosition.deletePositionAndApplications(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar la vacante y sus postulaciones:', error.message);
        res.status(500).send({ message: 'Error al eliminar la vacante y sus postulaciones: ' + error.message });
    }
};
