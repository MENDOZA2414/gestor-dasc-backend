const EntidadReceptora = require('../models/entidadReceptora');

// Obtener una entidad receptora por ID
const obtenerEntidadReceptoraPorID = async (req, res) => {
    try {
        const entidadID = req.params.id;
        const entidad = await EntidadReceptora.obtenerEntidadReceptoraPorID(entidadID);
        res.status(200).json(entidad);
    } catch (error) {
        console.error('Error al obtener la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al obtener la entidad receptora' });
    }
};

// Obtener todas las entidades receptoras
const obtenerTodasLasEntidades = async (req, res) => {
    try {
        const entidades = await EntidadReceptora.obtenerTodasLasEntidades();
        res.status(200).json(entidades);
    } catch (error) {
        console.error('Error al obtener todas las entidades:', error.message);
        res.status(500).json({ message: 'Error al obtener todas las entidades' });
    }
};

// Obtener entidades por estatus
const obtenerEntidadesPorEstatus = async (req, res) => {
    try {
        const { estatus } = req.query;
        const entidades = await EntidadReceptora.obtenerEntidadesPorEstatus(estatus);
        res.status(200).json(entidades);
    } catch (error) {
        console.error('Error al obtener entidades por estatus:', error.message);
        res.status(500).json({ message: 'Error al obtener entidades por estatus' });
    }
};

// Registrar una entidad receptora
const registrarEntidadReceptora = async (req, res) => {
    try {
        const entidadData = req.body;
        const resultado = await EntidadReceptora.registrarEntidadReceptora(entidadData);
        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al registrar la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al registrar la entidad receptora', error: error.message });
    }
};

// Eliminar una entidad receptora por ID
const eliminarEntidadReceptora = async (req, res) => {
    try {
        const entidadID = req.params.entidadID;
        const resultado = await EntidadReceptora.eliminarEntidadReceptora(entidadID);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al eliminar la entidad receptora' });
    }
};

module.exports = {
    obtenerEntidadReceptoraPorID,
    obtenerTodasLasEntidades,
    obtenerEntidadesPorEstatus,
    registrarEntidadReceptora,
    eliminarEntidadReceptora
};
