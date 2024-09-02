const PostulacionAlumno = require('../models/postulacionAlumno');

exports.obtenerAplicacionesPorVacanteID = async (req, res) => {
    try {
        const vacanteID = req.params.vacanteID;
        const aplicaciones = await PostulacionAlumno.obtenerAplicacionesPorVacanteID(vacanteID);
        if (aplicaciones.length > 0) {
            res.status(200).send(aplicaciones);
        } else {
            res.status(404).send({ message: 'No hay postulaciones' });
        }
    } catch (error) {
        console.error('Error en la consulta:', error.message);
        res.status(500).send({ message: 'Error en el servidor', error: error.message });
    }
};

exports.obtenerCartaPresentacionPorID = async (req, res) => {
    try {
        const postulacionID = req.params.id;
        const cartaPresentacion = await PostulacionAlumno.obtenerCartaPresentacionPorID(postulacionID);
        if (cartaPresentacion) {
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(cartaPresentacion, 'binary'));
        } else {
            res.status(404).send({ message: 'Documento no encontrado' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor: ' + error.message });
    }
};

exports.verificarPostulacionAlumno = async (req, res) => {
    try {
        const { alumnoID, vacanteID } = req.params;
        const yaAplicado = await PostulacionAlumno.verificarPostulacionAlumno(alumnoID, vacanteID);
        res.json({ aplicado: yaAplicado });
    } catch (error) {
        console.error('Error verificando postulación:', error.message);
        res.status(500).json({ error: 'Error verificando postulación' });
    }
};

exports.obtenerPostulacionesPorAlumnoID = async (req, res) => {
    try {
        const alumnoID = req.params.alumnoID;
        const postulaciones = await PostulacionAlumno.obtenerPostulacionesPorAlumnoID(alumnoID);
        res.json(postulaciones);
    } catch (error) {
        console.error('Error obteniendo postulaciones:', error.message);
        res.status(500).json({ error: 'Error obteniendo postulaciones' });
    }
};

exports.rechazarPostulacion = async (req, res) => {
    try {
        const { postulacionID } = req.body;
        const eliminado = await PostulacionAlumno.rechazarPostulacion(postulacionID);
        if (!eliminado) {
            res.status(404).send({ message: 'No se encontró la postulación' });
        } else {
            res.status(200).send({ message: 'Postulación eliminada con éxito' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor al eliminar la postulación', error: error.message });
    }
};

exports.aceptarPostulacion = async (req, res) => {
    try {
        const { postulacionID } = req.body;
        const resultado = await PostulacionAlumno.aceptarPostulacion(postulacionID);
        res.status(201).send(resultado);
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor al registrar la práctica profesional', error: error.message });
    }
};
