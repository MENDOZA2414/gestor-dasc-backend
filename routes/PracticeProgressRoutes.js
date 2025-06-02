const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/AuthMiddleware');
const practiceProgressController = require('../controllers/PracticeProgressController');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const checkUserType = require('../middlewares/CheckUserType');

// Ruta para el estudiante autenticado
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  practiceProgressController.getMyPracticeProgress
);

// Ruta para admins, asesores, etc.
router.get(
  '/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  practiceProgressController.getPracticeProgress
);

module.exports = router;
