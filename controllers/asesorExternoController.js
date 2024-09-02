const AsesorExterno = require('../models/asesorExterno');

// Obtener un asesor externo por ID
exports.obtenerAsesorExternoPorID = async (req, res) => {
    try {
        const asesorExternoID = req.params.id;
        const asesor = await AsesorExterno.obtenerAsesorExternoPorID(asesorExternoID);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al obtener el asesor externo:', error.message);
        res.status(500).json({ message: 'Error al obtener el asesor externo' });
    }
};

// Inicio de sesión de asesor externo
exports.iniciarSesionAsesorExterno = async (req, res) => {
    try {
        const { email, password } = req.body;
        const asesor = await AsesorExterno.iniciarSesionAsesorExterno(email, password);
        res.status(200).json(asesor);
    } catch (error) {
        console.error('Error al iniciar sesión del asesor externo:', error.message);
        res.status(401).json({ message: error.message });
    }
};
