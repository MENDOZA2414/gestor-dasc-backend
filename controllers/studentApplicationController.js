const StudentApplication = require('../models/studentApplication');

exports.getApplicationsByPositionID = async (req, res) => {
    try {
        const positionID = req.params.positionID;
        const applications = await StudentApplication.getApplicationsByPositionID(positionID);
        if (applications.length > 0) {
            res.status(200).send(applications);
        } else {
            res.status(404).send({ message: 'No hay postulaciones' });
        }
    } catch (error) {
        console.error('Error en la consulta:', error.message);
        res.status(500).send({ message: 'Error en el servidor', error: error.message });
    }
};

exports.getCoverLetterByID = async (req, res) => {
    try {
        const applicationID = req.params.id;
        const coverLetter = await StudentApplication.getCoverLetterByID(applicationID);
        if (coverLetter) {
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(coverLetter, 'binary'));
        } else {
            res.status(404).send({ message: 'Documento no encontrado' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor: ' + error.message });
    }
};

exports.verifyStudentApplication = async (req, res) => {
    try {
        const { studentID, positionID } = req.params;
        const hasApplied = await StudentApplication.verifyStudentApplication(studentID, positionID);
        res.json({ applied: hasApplied });
    } catch (error) {
        console.error('Error verificando postulación:', error.message);
        res.status(500).json({ error: 'Error verificando postulación' });
    }
};

exports.getApplicationsByStudentID = async (req, res) => {
    try {
        const studentID = req.params.studentID;
        const applications = await StudentApplication.getApplicationsByStudentID(studentID);
        res.json(applications);
    } catch (error) {
        console.error('Error obteniendo postulaciones:', error.message);
        res.status(500).json({ error: 'Error obteniendo postulaciones' });
    }
};

exports.rejectApplication = async (req, res) => {
    try {
        const { applicationID } = req.body;
        const deleted = await StudentApplication.rejectApplication(applicationID);
        if (!deleted) {
            res.status(404).send({ message: 'No se encontró la postulación' });
        } else {
            res.status(200).send({ message: 'Postulación eliminada con éxito' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor al eliminar la postulación', error: error.message });
    }
};

exports.acceptApplication = async (req, res) => {
    try {
        const { applicationID } = req.body;
        const result = await StudentApplication.acceptApplication(applicationID);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ message: 'Error en el servidor al registrar la práctica profesional', error: error.message });
    }
};
