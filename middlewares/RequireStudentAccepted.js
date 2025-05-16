const pool = require('../config/db');

const requireStudentAccepted = async (req, res, next) => {
  try {
    // Solo aplica para estudiantes
    if (req.user.userTypeID !== 2) {
      return next(); // No es estudiante, permitir continuar
    }

    const [rows] = await pool.query(
      `SELECT status FROM Student WHERE userID = ?`,
      [req.user.id]
    );

    const student = rows[0];

    if (!student) {
      return res.status(404).json({ message: 'No se encontró información del estudiante.' });
    }

    if (student.status !== 'Aceptado') {
      return res.status(403).json({
        message: `Tu cuenta está en estado "${student.status}". Debes esperar aprobación del administrador.`
      });
    }

    next(); // El estudiante está aceptado
  } catch (error) {
    console.error('Error en requireStudentAccepted:', error.message);
    res.status(500).json({ message: 'Error al validar el estado del estudiante' });
  }
};

module.exports = requireStudentAccepted;
