const AsesorInterno = require('../models/asesorInterno');

// Obtener un asesor interno por ID
exports.obtenerAsesorInternoPorID = async (req, res) => {
    try {
        const asesorInternoID = req.params.id;
        const asesor = await AsesorInterno.obtenerAsesorInternoPorID(asesorInternoID);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al obtener el asesor interno:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor interno' });
    }
};

// Obtener todos los asesores internos
exports.obtenerTodosLosAsesoresInternos = async (req, res) => {
    try {
        const asesores = await AsesorInterno.obtenerTodosLosAsesoresInternos();
        res.status(200).json(asesores);
    } catch (error) {
        console.error('Error al obtener los asesores internos:', error.message);
        res.status(500).json({ message: 'Error al obtener los asesores internos' });
    }
};

// Iniciar sesión de asesor interno
exports.iniciarSesionAsesorInterno = async (req, res) => {
    try {
        const { email, password } = req.body;
        const asesor = await AsesorInterno.iniciarSesionAsesorInterno(email, password);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al iniciar sesión de asesor interno:', error.message);
        res.status(401).json({ message: error.message });
    }
};

// Contar asesores internos (prueba de conexión)
exports.contarAsesoresInternos = async (req, res) => {
    try {
        const count = await AsesorInterno.contarAsesoresInternos();
        res.status(200).json({ message: 'Consulta exitosa', count });
    } catch (error) {
        console.error('Error en la consulta de prueba:', error.message);
        res.status(500).json({ message: 'Error en el servidor ejecutando la consulta de prueba', error: error.message });
    }
};
