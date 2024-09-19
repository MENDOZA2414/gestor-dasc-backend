const AsesorExterno = require('../models/asesorExterno');

// Controlador para registrar un asesor externo
const registrarAsesorExternoController = async (req, res) => {
    try {
        const asesorData = req.body;
        const result = await AsesorExterno.registrarAsesorExterno(asesorData);
        res.status(201).send(result);
    } catch (error) {
        console.error('Error al registrar el asesor externo:', error.message);
        res.status(500).send({ message: 'Error al registrar el asesor externo', error: error.message });
    }
};

// Controlador para obtener un asesor externo por ID
const obtenerAsesorExternoPorID = async (req, res) => {
    try {
        const asesorExternoID = req.params.id;
        const asesor = await AsesorExterno.obtenerAsesorExternoPorID(asesorExternoID);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al obtener el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor externo' });
    }
};

// Exportar los controladores
module.exports = {
    registrarAsesorExternoController,
    obtenerAsesorExternoPorID
};
