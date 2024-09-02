const express = require('express');
const router = express.Router();
const entidadReceptoraController = require('../controllers/entidadReceptoraController');

// Ruta para obtener una entidad receptora por ID
router.get('/:id', entidadReceptoraController.obtenerEntidadReceptoraPorID);

// Ruta para obtener todas las entidades receptoras
router.get('/all', entidadReceptoraController.obtenerTodasLasEntidades);

// Ruta para obtener entidades receptoras por estatus
router.get('/', entidadReceptoraController.obtenerEntidadesPorEstatus);

// Ruta para el inicio de sesión de una entidad receptora
router.post('/login', entidadReceptoraController.iniciarSesionEntidad);

// Ruta para eliminar una entidad receptora por ID
router.delete('/:entidadID', entidadReceptoraController.eliminarEntidadReceptora);

module.exports = router;
