// Rutas para gestionar las entidades receptoras (Company).

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/CompanyController');

// Obtener todas las entidades receptoras.
router.get('/all', companyController.getAllCompanies);

// Obtener entidades receptoras filtradas por estatus.
router.get('/', companyController.getCompaniesByStatus);

// Obtener una entidad receptora por ID.
router.get('/:id', companyController.getCompanyByID);

// Registrar una nueva entidad receptora.
router.post('/register', companyController.registerCompany);

// Eliminar una entidad receptora por ID.
router.delete('/:companyID', companyController.deleteCompany);

// Actualizar los datos de una entidad receptora por ID.
router.patch('/:companyID', companyController.patchCompanyController);

module.exports = router;
