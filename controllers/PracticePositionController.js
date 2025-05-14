const PracticePosition = require('../models/PracticePosition');

// Obtener vacante por ID
exports.getPositionByID = async (req, res) => {
    try {
        const position = await PracticePosition.getPositionByID(req.params.id);
        res.status(200).json(position);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

// Obtener vacantes por ID de empresa
exports.getPositionsByCompanyID = async (req, res) => {
    try {
        const { entidadID } = req.params;
        const positions = await PracticePosition.getPositionsByCompanyID(entidadID);
        if (!positions.length) {
            return res.status(404).json({ message: 'No hay vacantes asociadas a esta entidad.' });
        }
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error al obtener vacantes por entidad:', error.message);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener todas las vacantes con paginación
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

// Obtener vacantes por estatus
exports.getPositionsByStatus = async (req, res) => {
    try {
        const positions = await PracticePosition.getPositionsByStatus(req.query.status);
        res.status(200).json(positions);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

// Obtener vacantes por ID de evaluador externo
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

// Eliminar vacante 
exports.deletePosition = async (req, res) => {
    try {
        const result = await PracticePosition.deletePosition(req.params.practicePositionID);
        res.status(200).json({ message: 'Vacante y sus postulaciones marcadas como eliminadas' });
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

// Eliminar vacante y sus postulaciones
exports.deletePositionAndApplications = async (req, res) => {
    try {
        const result = await PracticePosition.deletePositionAndApplications(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar la vacante y sus postulaciones:', error.message);
        res.status(500).send({ message: 'Error al eliminar la vacante y sus postulaciones: ' + error.message });
    }
};

//Actualizar parcialmente una vacante
exports.patchPositionController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
        }

        const result = await PracticePosition.patchPosition(id, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al actualizar vacante:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar la vacante', error: error.message });
    }
};
