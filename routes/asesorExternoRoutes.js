const express = require('express');
const router = express.Router();
const { obtenerAsesorExternoPorID, registrarAsesorExternoController } = require('../controllers/asesorExternoController');

// Ruta para obtener un asesor externo por ID
router.get('/:id', obtenerAsesorExternoPorID);

// Ruta para registrar un asesor externo
router.post('/registro', registrarAsesorExternoController);

module.exports = router;
