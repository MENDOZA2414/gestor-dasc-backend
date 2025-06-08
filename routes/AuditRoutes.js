const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Registro de auditoría de acciones realizadas sobre documentos
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Obtener eventos de auditoría relacionados con documentos
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentID
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filtrar auditoría por ID del alumno
 *       - in: query
 *         name: documentID
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filtrar auditoría por ID del documento
 *     responses:
 *       200:
 *         description: Lista de eventos de auditoría encontrados
 *       500:
 *         description: Error al consultar la auditoría
 */
router.get('/', authMiddleware, checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { studentID, documentID } = req.query;

  let query = `SELECT * FROM Audit WHERE tableName = 'StudentDocumentation'`;
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
