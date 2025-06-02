const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

// Obtener todos los eventos de auditoría relacionados con documentos
router.get('/', authMiddleware, checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { studentID, documentID } = req.query;

  let query = `SELECT * FROM Audit WHERE table = 'StudentDocumentation'`;
  const params = [];

  if (studentID) {
    query += ` AND studentID = ?`;
    params.push(studentID);
  }

  if (documentID) {
    query += ` AND documentID = ?`;
    params.push(documentID);
  }

  query += ` ORDER BY date DESC`;

  try {
    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al consultar auditoría:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;
