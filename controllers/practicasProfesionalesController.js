const PracticaProfesional = require('../models/practicasProfesionales');

exports.obtenerUltimaPracticaPorNumControl = async (req, res) => {
    try {
        const numControl = req.params.numControl;
        const practica = await PracticaProfesional.obtenerUltimaPracticaPorNumControl(numControl);
        res.status(200).json(practica);
    } catch (error) {
        console.error('Error al obtener la última práctica profesional:', error.message);
        res.status(500).json({ message: error.message });
    }
};
