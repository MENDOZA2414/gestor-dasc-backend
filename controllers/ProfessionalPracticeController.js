// Controlador para gestionar prácticas profesionales

const ProfessionalPractice = require('../models/ProfessionalPractice');

// Obtener la práctica profesional registrada de un estudiante
exports.getPracticeByStudentID = async (req, res) => {
  try {
    const studentID = req.params.studentID;
    const practice = await ProfessionalPractice.getPracticeByStudentID(studentID);

    if (!practice) {
      return res.status(404).json({ message: 'No se encontró una práctica registrada para este estudiante.' });
    }

    res.status(200).json(practice);
  } catch (error) {
    console.error('Error al obtener la práctica profesional:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas registradas por una empresa
exports.getPracticesByCompanyID = async (req, res) => {
  try {
    const companyID = req.params.companyID;
    const practices = await ProfessionalPractice.getPracticesByCompanyID(companyID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas registradas para esta empresa.' });
    }

    res.status(200).json(practices);
  } catch (error) {
    console.error('Error al obtener prácticas por empresa:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas asignadas a un asesor externo
exports.getPracticesByExternalAssessorID = async (req, res) => {
  try {
    const externalAssessorID = req.params.externalAssessorID;
    const practices = await ProfessionalPractice.getPracticesByExternalAssessorID(externalAssessorID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas asignadas para este asesor externo.' });
    }

    res.status(200).json(practices);
  } catch (error) {
    console.error('Error al obtener prácticas por asesor externo:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas asignadas a un asesor interno
exports.getPracticesByInternalAssessorID = async (req, res) => {
  try {
    const internalAssessorID = req.params.internalAssessorID;
    const practices = await ProfessionalPractice.getPracticesByInternalAssessorID(internalAssessorID);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas para este asesor interno.' });
    }

    res.status(200).json(practices);
  } catch (error) {
    console.error('Error al obtener prácticas por asesor interno:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener la práctica de un alumno asignado a un asesor interno específico
exports.getStudentPracticeByAssessor = async (req, res) => {
  try {
    const { internalAssessorID, studentID } = req.params;
    const practice = await ProfessionalPractice.getStudentPracticeByAssessor(internalAssessorID, studentID);

    if (!practice) {
      return res.status(404).json({ message: 'No se encontró una práctica registrada para este alumno bajo ese asesor.' });
    }

    res.status(200).json(practice);
  } catch (error) {
    console.error('Error al obtener práctica del alumno:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todas las prácticas registradas, con filtros opcionales por carrera y estado
exports.getAllPractices = async (req, res) => {
  try {
    const { career, status } = req.query;
    const practices = await ProfessionalPractice.getAllPractices(career, status);

    if (practices.length === 0) {
      return res.status(404).json({ message: 'No se encontraron prácticas con esos filtros.' });
    }

    res.status(200).json(practices);
  } catch (error) {
    console.error('Error al obtener prácticas:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener estudiantes asignados a un asesor externo
exports.getStudentsByExternalAssessorID = async (req, res) => {
  try {
    const { externalAssessorID } = req.params;
    const students = await ProfessionalPractice.getStudentsByExternalAssessorID(externalAssessorID);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes para este asesor externo.' });
    }

    res.status(200).json(students);
  } catch (error) {
    console.error('Error al obtener estudiantes por asesor externo:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener estudiantes en prácticas en una institución específica
exports.getStudentsByCompanyID = async (req, res) => {
  try {
    const { companyID } = req.params;
    const students = await ProfessionalPractice.getStudentsByCompanyID(companyID);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No se encontraron estudiantes para esta institución.' });
    }

    res.status(200).json(students);
  } catch (error) {
    console.error('Error al obtener estudiantes por institución:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar información de una práctica profesional
exports.patchPractice = async (req, res) => {
  try {
    const { practiceID } = req.params;
    const updateData = req.body;

    const result = await ProfessionalPractice.patchPractice(practiceID, updateData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar práctica:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar la práctica profesional', error: error.message });
  }
};


// Eliminar lógicamente una práctica profesional
exports.deletePractice = async (req, res) => {
  try {
    const { practiceID } = req.params;
    const result = await ProfessionalPractice.deletePractice(practiceID);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al eliminar práctica:', error.message);
    res.status(500).json({ message: 'No se pudo eliminar la práctica profesional', error: error.message });
  }
};
