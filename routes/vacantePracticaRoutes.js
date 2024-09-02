const express = require('express');
const router = express.Router();
const vacantePracticaController = require('../controllers/vacantePracticaController');

// Ruta para obtener una vacante de práctica por ID
router.get('/:id', vacantePracticaController.obtenerVacantePorID);

// Ruta para obtener las vacantes de práctica por ID de entidad
router.get('/entidad/:entidadID', vacantePracticaController.obtenerVacantesPorEntidadID);

// Obtener todas las vacantes prácticas
router.get('/all/:page/:limit', vacantePracticaController.obtenerTodasLasVacantes);

// Obtener vacantes por estatus
router.get('/', vacantePracticaController.obtenerVacantesPorEstatus);

// Ruta para crear una nueva vacante de práctica
router.post('/', vacantePracticaController.crearVacante);

// Eliminar vacante
router.delete('/:vacantePracticaID', vacantePracticaController.eliminarVacante);

// Endpoint para eliminar una vacante junto con sus postulaciones
router.delete('/eliminar/:id', vacantePracticaController.eliminarVacanteYPostulaciones);

module.exports = router;
