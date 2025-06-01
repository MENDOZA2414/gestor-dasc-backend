const express = require('express');
const router = express.Router();
const companyController = require('../controllers/CompanyController');
const profileUploadMiddleware = require('../middlewares/ProfileUpload');
const authMiddleware = require('../middlewares/AuthMiddleware');
const checkRole = require('../middlewares/CheckRole');
const checkUserType = require('../middlewares/CheckUserType');

// Obtener todas las entidades receptoras.
router.get(
  '/all',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getAllCompanies
);

// Obtener entidades receptoras filtradas por estatus.
router.get(
  '/',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.getCompaniesByStatus
);

// Contar entidades receptoras
router.get(
  '/count',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.countCompaniesController
);

// Obtener el perfil de la entidad receptora del usuario autenticado.
router.get(
  '/me',
  authMiddleware,
  checkUserType(['company']),
  companyController.getCompanyProfile
);

// Obtener una entidad receptora por ID.
router.get(
    '/:id',
    authMiddleware,
    companyController.getCompanyByID
);

// Registrar una nueva entidad receptora.
router.post(
    '/register',
    profileUploadMiddleware,
    companyController.registerCompany
);

// Cambiar el status de una empresa (Aceptado, Rechazado, Pendiente)
router.patch(
  '/:userID/status',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.updateStatus
);

// Eliminar una entidad receptora por ID.
router.delete(
  '/:companyID',
  authMiddleware,
  checkRole(['SuperAdmin']),
  companyController.deleteCompany
);

// Actualizar los datos de una entidad receptora por ID.
router.patch(
  '/:userID',
  authMiddleware,
  checkRole(['Admin', 'SuperAdmin']),
  companyController.patchCompanyController
);

module.exports = router;