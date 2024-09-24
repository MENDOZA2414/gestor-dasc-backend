const express = require('express');
const router = express.Router();
const { getExternalAssessorByID, registerExternalAssessorController } = require('../controllers/externalAssessorController');

// Ruta para obtener un asesor externo por ID
router.get('/:id', getExternalAssessorByID);

// Ruta para registrar un asesor externo
router.post('/register', registerExternalAssessorController);

module.exports = router;
