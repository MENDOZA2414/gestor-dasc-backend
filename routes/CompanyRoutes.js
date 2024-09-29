const express = require('express');
const router = express.Router();
const companyController = require('../controllers/CompanyController');

// Ruta para obtener una entidad receptora por ID
router.get('/:id', companyController.getCompanyByID);

// Ruta para obtener todas las entidades receptoras
router.get('/all', companyController.getAllCompanies);

// Ruta para obtener entidades receptoras por estatus
router.get('/', companyController.getCompaniesByStatus);

// Ruta para registrar una entidad receptora
router.post('/register', companyController.registerCompany);

// Ruta para eliminar una entidad receptora por ID
router.delete('/:companyID', companyController.deleteCompany);

module.exports = router;
