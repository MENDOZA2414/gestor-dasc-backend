// Controlador para gestionar las operaciones de entidades receptoras.

const Company = require('../models/Company');

// Obtener una entidad receptora por ID
const getCompanyByID = async (req, res) => {
    try {
        const companyID = req.params.id;
        const company = await Company.getCompanyByID(companyID);
        res.status(200).json(company);
    } catch (error) {
        console.error('Error al obtener la entidad receptora:', error.message);
        res.status(500).json({ message: 'No se pudo obtener la entidad receptora.' });
    }
};

// Obtener todas las entidades receptoras
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.getAllCompanies();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error al obtener todas las entidades:', error.message);
        res.status(500).json({ message: 'No se pudo obtener la lista de entidades.' });
    }
};

// Obtener entidades receptoras por estatus
const getCompaniesByStatus = async (req, res) => {
    try {
        const { status } = req.query; // Status filtrado de la query
        const companies = await Company.getCompaniesByStatus(status);
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error al filtrar entidades:', error.message);
        res.status(500).json({ message: 'No se pudo filtrar por estatus.' });
    }
};

// Registrar una nueva entidad receptora
const registerCompany = async (req, res) => {
    try {
        const companyData = {
            ...req.body,
            profilePhotoName: req.generatedFileName || null,
            profilePhotoBuffer: req.bufferFile || null
        };

        const result = await Company.registerCompany(companyData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al registrar entidad:', error.message);
        res.status(500).json({ 
            message: 'No se pudo registrar la entidad.', 
            error: error.message 
        });
    }
};


// Eliminar lógicamente una entidad receptora por ID
const deleteCompany = async (req, res) => {
    try {
        const companyID = req.params.companyID;
        const result = await Company.deleteCompany(companyID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar entidad:', error.message);
        res.status(500).json({ message: 'No se pudo eliminar la entidad.' });
    }
};

// Actualizar una entidad receptora por ID
const updateCompany = async (req, res) => {
    try {
        const companyID = req.params.companyID;
        const updateData = req.body;
        const result = await Company.updateCompany(companyID, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al actualizar entidad:', error.message);
        res.status(500).json({ message: 'No se pudo actualizar la entidad.', error: error.message });
    }
};

// Exportar las funciones del controlador
module.exports = {
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    registerCompany,
    deleteCompany,
    updateCompany
};
