const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/UserRoleController');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');

// Solo admins pueden asignar roles
router.post('/assign', authMiddleware, checkRole(['Admin', 'SuperAdmin']), userRoleController.assignRoles);

// Usuario autenticado obtiene sus roles
router.get('/me', authMiddleware, userRoleController.getMyRoles);

// Ruta abierta (útil para pruebas desde el panel admin)
router.get('/:userID', userRoleController.getUserRoles);

module.exports = router;
