const Company = require('../models/Company');

// Obtener una entidad receptora por ID
const getCompanyByID = async (req, res) => {
    try {
        const companyID = req.params.id;
        const company = await Company.getCompanyByID(companyID);
        res.status(200).json(company);
    } catch (error) {
        console.error('Error al obtener la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al obtener la entidad receptora' });
    }
};

// Obtener todas las entidades receptoras
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.getAllCompanies();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error al obtener todas las entidades:', error.message);
        res.status(500).json({ message: 'Error al obtener todas las entidades' });
    }
};

// Obtener entidades por estatus
const getCompaniesByStatus = async (req, res) => {
    try {
        const { status } = req.query;
        const companies = await Company.getCompaniesByStatus(status);
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error al obtener entidades por estatus:', error.message);
        res.status(500).json({ message: 'Error al obtener entidades por estatus' });
    }
};

// Registrar una entidad receptora
const registerCompany = async (req, res) => {
    try {
        const companyData = req.body;
        const result = await Company.registerCompany(companyData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al registrar la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al registrar la entidad receptora', error: error.message });
    }
};

// Eliminar una entidad receptora por ID
const deleteCompany = async (req, res) => {
    try {
        const companyID = req.params.companyID;
        const result = await Company.deleteCompany(companyID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar la entidad receptora:', error.message);
        res.status(500).json({ message: 'Error al eliminar la entidad receptora' });
    }
};

module.exports = {
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    registerCompany,
    deleteCompany
};
