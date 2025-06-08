const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/AuthMiddleware');
const practiceProgressController = require('../controllers/PracticeProgressController');
const checkUserTypeOrRole = require('../middlewares/CheckUserTypeOrRole');
const checkUserType = require('../middlewares/CheckUserType');

/**
 * @swagger
 * tags:
 *   name: PracticeProgress
 *   description: Endpoints para consultar el progreso de prácticas profesionales
 */

/**
 * @swagger
 * /api/practiceProgress/me:
 *   get:
 *     summary: Obtener el progreso de la práctica del estudiante autenticado
 *     tags: [PracticeProgress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progreso de la práctica profesional del alumno
 */
router.get(
  '/me',
  authMiddleware,
  checkUserType(['student']),
  practiceProgressController.getMyPracticeProgress
);

/**
 * @swagger
 * /api/practiceProgress/{studentID}:
 *   get:
 *     summary: Obtener el progreso de la práctica de un estudiante específico
 *     tags: [PracticeProgress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentID
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progreso de la práctica del estudiante
 */
router.get(
  '/:studentID',
  authMiddleware,
  checkUserTypeOrRole(['internalAssessor', 'company'], ['Admin', 'SuperAdmin']),
  practiceProgressController.getPracticeProgress
);

module.exports = router;