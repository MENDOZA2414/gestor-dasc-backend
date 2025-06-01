const Company = require('../models/Company');
const getUserRoles = require('../utils/GetUserRoles');
const pool = require('../config/db');

// Obtener el perfil de la entidad receptora del usuario autenticado
const getCompanyProfile = async (req, res) => {
  try {
    const userID = req.user.id;

    const company = await Company.getByUserID(userID);
    if (!company || company.recordStatus === 'Eliminado') {
      return res.status(404).json({ message: 'Entidad no encontrada o eliminada.' });
    }

    res.status(200).json(company);
  } catch (error) {
    console.error('Error al obtener perfil de la entidad:', error.message);
    res.status(500).json({ message: 'Error al obtener perfil de la entidad.' });
  }
};

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

    let company;
    try {
      company = await Company.getCompanyByID(companyID);
    } catch (err) {
      return res.status(404).json({ message: 'Entidad no encontrada o ya eliminada.' });
    }

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
    const userID = parseInt(req.params.userID);
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    // Verificar que la entidad exista
    const [companyRow] = await pool.query(
      'SELECT * FROM Company WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );
    if (!companyRow || companyRow.length === 0) {
      return res.status(404).json({ message: 'Entidad receptora no encontrada o ya eliminada.' });
    }

    // Separar campos
    const userFields = ['email', 'phone'];
    const userUpdates = {};
    const companyUpdates = {};

    for (const key in updateData) {
      if (userFields.includes(key)) {
        userUpdates[key] = updateData[key];
      } else if (key !== 'recordStatus' && key !== 'status') {
        companyUpdates[key] = updateData[key];
      }
    }

    // Actualizar tabla Company
    let companyResult = null;
    if (Object.keys(companyUpdates).length > 0) {
      companyResult = await Company.patchCompany(userID, companyUpdates);
    }

    // Actualizar tabla User
    let userResult = null;
    if (Object.keys(userUpdates).length > 0) {
      const fields = Object.keys(userUpdates).map(field => `${field} = ?`).join(', ');
      const values = Object.values(userUpdates);
      values.push(userID);
      await pool.query(`UPDATE User SET ${fields} WHERE userID = ?`, values);
      userResult = { message: 'Datos de usuario actualizados' };
    }

    return res.status(200).json({
      message: 'Entidad receptora actualizada correctamente',
      companyResult,
      userResult
    });
  } catch (error) {
    console.error('Error al actualizar parcialmente la entidad receptora:', error.message);
    res.status(500).json({ message: 'No se pudo actualizar la entidad receptora', error: error.message });
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

// Actualizar el estado de una entidad receptora por ID
const updateStatus = async (req, res) => {
  const { userID } = req.params;
  const { status } = req.body;
  const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido. Usa: Aceptado, Rechazado o Pendiente.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE Company SET status = ? WHERE userID = ? AND recordStatus = "Activo"',
      [status, userID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Empresa no encontrada o eliminada.' });
    }

    return res.status(200).json({ message: `Status de la empresa actualizado a "${status}" correctamente.` });
  } catch (error) {
    console.error('Error al actualizar status de la empresa:', error.message);
    return res.status(500).json({ message: 'Error interno al actualizar status.', error: error.message });
  }
};

module.exports = {
    getCompanyProfile,
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    registerCompany,
    deleteCompany,
    patchCompanyController,
    countCompaniesController,
    updateStatus
};
