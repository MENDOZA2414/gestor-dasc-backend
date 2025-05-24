// Controlador para gestionar las operaciones de entidades receptoras.

const Company = require('../models/Company');
const getUserRoles = require('../utils/GetUserRoles');

// Obtener una entidad receptora por ID
const getCompanyByID = async (req, res) => {
  try {
    const companyID = parseInt(req.params.id);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const company = await Company.getCompanyByID(companyID);

    if (!company || company.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Entidad no encontrada o eliminada.' });
    }

    const roles = await getUserRoles(requesterID);

    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');
    const isOwner = userTypeID === 4 && requesterID === company.userID;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta entidad receptora.' });
    }

    return res.status(200).json(company);

  } catch (error) {
    console.error('Error al obtener la entidad receptora:', error.message);
    return res.status(500).json({ message: 'No se pudo obtener la entidad receptora.', error: error.message });
  }
};

// Obtener todas las entidades receptoras
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.getAllCompanies();

    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: 'No se encontraron entidades registradas.' });
    }

    res.status(200).json(companies);

  } catch (error) {
    console.error('Error al obtener todas las entidades:', error.message);
    res.status(500).json({ message: 'No se pudo obtener la lista de entidades.', error: error.message });
  }
};

// Obtener entidades receptoras por estatus
const getCompaniesByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const validStatuses = ['Pendiente', 'Aceptado', 'Rechazado'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Parámetro "status" inválido o no proporcionado.' });
    }

    const companies = await Company.getCompaniesByStatus(status);

    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: `No se encontraron entidades con estatus "${status}".` });
    }

    res.status(200).json(companies);

  } catch (error) {
    console.error('Error al filtrar entidades:', error.message);
    res.status(500).json({ message: 'No se pudo filtrar por estatus.', error: error.message });
  }
};

// Registrar una nueva entidad receptora
const registerCompany = async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      companyName,
      fiscalName,
      rfc,
      address,
      externalNumber,
      interiorNumber,
      suburb,
      city,
      state,
      zipCode,
      companyPhone,
      category,
      areaID,
      website,
      needs,
      modality,
      economicSupport
    } = req.body;

    // Validación básica de campos obligatorios mínimos
    if (
      !email || !password || !phone || !companyName || !fiscalName ||
      !rfc || !address || !externalNumber || !state || !city || !zipCode
    ) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para registrar la entidad.' });
    }

    const companyData = {
      email,
      password,
      phone,
      rfc,
      fiscalName,
      companyName,
      address,
      externalNumber,
      interiorNumber: interiorNumber || null,
      suburb: suburb || null,
      city,
      state,
      zipCode,
      companyPhone: companyPhone || null,
      category,
      areaID,
      website: website || null,
      needs: needs || null,
      modality: modality || null,
      economicSupport: economicSupport || null,
      status: 'Pendiente', // estado inicial hasta aprobación
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null
    };

    const result = await Company.registerCompany(companyData);

    return res.status(201).json({
      message: 'Entidad registrada correctamente. Será activada por un administrador.',
      data: result
    });

  } catch (error) {
    console.error('Error al registrar entidad:', error.message);
    return res.status(500).json({
      message: 'No se pudo registrar la entidad.',
      error: error.message
    });
  }
};


// Eliminar lógicamente una entidad receptora por ID
const deleteCompany = async (req, res) => {
  try {
    const companyID = parseInt(req.params.companyID);

    // Verificar que exista y esté activa
    const company = await Company.getCompanyByID(companyID);
    if (!company || company.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Entidad no encontrada o ya eliminada.' });
    }

    const result = await Company.deleteCompany(companyID);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No se pudo eliminar la entidad. Intenta de nuevo.' });
    }

    res.status(200).json({ message: 'Entidad eliminada correctamente.' });

  } catch (error) {
    console.error('Error al eliminar entidad:', error.message);
    res.status(500).json({ message: 'No se pudo eliminar la entidad.', error: error.message });
  }
};

// Actualizar una entidad receptora por ID
const patchCompanyController = async (req, res) => {
  try {
    const companyID = parseInt(req.params.companyID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    // Verificar existencia de la entidad
    const company = await Company.getCompanyByID(companyID);
    if (!company || company.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Entidad no encontrada o eliminada.' });
    }

    // Obtener roles
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');
    const isOwner = userTypeID === 4 && requesterID === company.userID;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta entidad.' });
    }

    const result = await Company.patchCompany(companyID, updateData);
    res.status(200).json({ message: 'Entidad actualizada correctamente.', result });

  } catch (error) {
    console.error('Error al actualizar entidad:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar la entidad.', error: error.message });
  }
};

// Contar el número total de entidades receptoras
const countCompaniesController = async (req, res) => {
  try {
    const result = await Company.countCompanies();
    res.status(200).json({ total: result.total });
  } catch (error) {
    console.error('Error al contar entidades:', error.message);
    res.status(500).json({ message: 'Error al contar entidades receptoras.', error: error.message });
  }
};

module.exports = {
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    registerCompany,
    deleteCompany,
    patchCompanyController,
    countCompaniesController
};
