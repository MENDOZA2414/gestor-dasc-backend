const { calculatePracticeProgress } = require('../services/PracticeProgressService');
const { hasAccessToPractice } = require('../services/PracticeAccessService');
const pool = require('../config/db'); 

const getPracticeProgress = async (req, res) => {
  try {
    const studentID = parseInt(req.params.studentID);
    if (isNaN(studentID)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const access = await hasAccessToPractice(studentID, req.user);
    if (!access) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta práctica profesional.' });
    }

    const result = await calculatePracticeProgress(studentID);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error al obtener el progreso:', err.message);
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
};

// Estudiante autenticado consulta su propio progreso
const getMyPracticeProgress = async (req, res) => {
  try {
    const userID = req.user.id;

    // Buscar el studentID correspondiente
    const [[student]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );

    if (!student) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const studentID = student.studentID;

    const result = await calculatePracticeProgress(studentID);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error al obtener el progreso del alumno:', err.message);
    res.status(500).json({ message: 'Error del servidor', error: err.message });
  }
};

module.exports = {
  getPracticeProgress,
  getMyPracticeProgress
};
