const VacantePractica = require('../models/vacantePractica');

exports.obtenerVacantePorID = async (req, res) => {
    try {
        const vacante = await VacantePractica.obtenerVacantePorID(req.params.id);
        res.status(200).json(vacante);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.obtenerVacantesPorEntidadID = async (req, res) => {
    try {
        const vacantes = await VacantePractica.obtenerVacantesPorEntidadID(req.params.entidadID);
        res.status(200).json(vacantes);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.obtenerTodasLasVacantes = async (req, res) => {
    try {
        const { page, limit } = req.params;
        const vacantes = await VacantePractica.obtenerTodasLasVacantes(parseInt(page), parseInt(limit));
        res.status(200).json(vacantes);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.obtenerVacantesPorEstatus = async (req, res) => {
    try {
        const vacantes = await VacantePractica.obtenerVacantesPorEstatus(req.query.estatus);
        res.status(200).json(vacantes);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.crearVacante = async (req, res) => {
    try {
        const vacante = await VacantePractica.crearVacante(req.body);
        res.status(201).json({
            status: 201,
            message: 'Vacante creada con éxito',
            data: vacante
        });
    } catch (error) {
        console.error('Error al crear la vacante:', error.message);
        res.status(400).send({ message: error.message });
    }
};

exports.eliminarVacante = async (req, res) => {
    try {
        const resultado = await VacantePractica.eliminarVacante(req.params.vacantePracticaID);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en el servidor:', error.message);
        res.status(500).send({ message: 'Error en el servidor' });
    }
};

exports.eliminarVacanteYPostulaciones = async (req, res) => {
    try {
        const resultado = await VacantePractica.eliminarVacanteYPostulaciones(req.params.id);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al eliminar la vacante y sus postulaciones:', error.message);
        res.status(500).send({ message: 'Error al eliminar la vacante y sus postulaciones: ' + error.message });
    }
};
