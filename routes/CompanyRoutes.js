const express = require('express');
const router = express.Router();

const companyController = require('../controllers/CompanyController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

// ──────── Rutas públicas ────────

// Registrar una nueva entidad receptora
router.post(
  '/register',
  profileUploadMiddleware,
  companyController.registerCompany
);

// ──────── Rutas protegidas ────────

// Obtener todas las entidades receptoras
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getAllCompanies
);

// Obtener entidades receptoras filtradas por estatus
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getCompaniesByStatus
);

// Obtener cantidad total de entidades receptoras
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.countCompaniesController
);

// Obtener perfil de la entidad receptora autenticada
router.get(
  '/me',
  authMiddleware,
  checkUserType(['company']),
  companyController.getCompanyProfile
);

// Obtener entidad receptora por ID
router.get(
  '/:id',
  authMiddleware,
  companyController.getCompanyByID
);

// Actualizar datos de la entidad receptora
router.patch(
  '/:userID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.patchCompanyController
);

// Cambiar estatus de la entidad receptora
router.patch(
  '/:userID/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.updateStatus
);

// Eliminar entidad receptora por ID (eliminación lógica)
router.delete(
  '/:companyID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  companyController.deleteCompany
);

module.exports = router;