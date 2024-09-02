const EntidadReceptora = require('../models/entidadReceptora');

// Obtener una entidad receptora por ID
exports.obtenerEntidadReceptoraPorID = async (req, res) => {
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
exports.obtenerTodasLasEntidades = async (req, res) => {
    try {
        const entidades = await EntidadReceptora.obtenerTodasLasEntidades();
        res.status(200).json(entidades);
    } catch (error) {
        console.error('Error al obtener todas las entidades:', error.message);
        res.status(500).json({ message: 'Error al obtener todas las entidades' });
    }
};

// Obtener entidades por estatus
exports.obtenerEntidadesPorEstatus = async (req, res) => {
    try {
        const { estatus } = req.query;
        const entidades = await EntidadReceptora.obtenerEntidadesPorEstatus(estatus);
        res.status(200).json(entidades);
    } catch (error) {
        console.error('Error al obtener entidades por estatus:', error.message);
        res.status(500).json({ message: 'Error al obtener entidades por estatus' });
    }
};

// Inicio de sesión para una entidad receptora
exports.iniciarSesionEntidad = async (req, res) => {
    try {
        const { email, password } = req.body;
        const entidad = await EntidadReceptora.iniciarSesionEntidad(email, password);
        res.status(200).json(entidad);
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

// Eliminar una entidad receptora por ID
exports.eliminarEntidadReceptora = async (req, res) => {
    try {
        const entidadID = req.params.entidadID;
        const resultado = await EntidadReceptora.eliminarEntidadReceptora(entidadID);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al eliminar la entidad receptora' });
    }
};
