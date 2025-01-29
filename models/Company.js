// Modelo para gestionar las entidades receptoras (Company) en la base de datos.

const pool = require('../config/db');
const { registerUser } = require('./User');

// Registra una nueva entidad receptora en la base de datos.
const registerCompany = async (companyData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            email, password, phone, rfc, fiscalName, companyName, address, externalNumber,
            interiorNumber, suburb, city, state, zipCode, companyPhone, category, areaID,
            website, companyStatus, status, photo
        } = companyData;

        // Validar datos básicos necesarios.
        if (!rfc || !fiscalName || !companyName) {
            throw new Error('RFC, nombre fiscal y nombre de la empresa son obligatorios');
        }

        // Crear usuario para la compañía.
        const userID = await registerUser(connection, email, password, phone, 3);

        // Insertar la compañía en la base de datos.
        const query = `
            INSERT INTO Company (
                userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber,
                suburb, city, state, zipCode, companyPhone, category, areaID, website,
                companyStatus, status, photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber,
            suburb, city, state, zipCode, companyPhone, category, areaID, website,
            companyStatus, status, photo
        ]);

        await connection.commit();
        return { message: 'Entidad receptora registrada exitosamente' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Busca una entidad receptora por su ID.
const getCompanyByID = async (companyID) => {
    const query = 'SELECT * FROM Company WHERE companyID = ?';
    const [results] = await pool.query(query, [companyID]);

    if (results.length === 0) {
        throw new Error('La entidad receptora no existe');
    }
    return results[0];
};

// Devuelve todas las entidades receptoras registradas.
const getAllCompanies = async () => {
    const query = `
        SELECT companyID, companyName, photo 
        FROM Company
        ORDER BY companyName
    `;
    const [results] = await pool.query(query);
    return results;
};

// Devuelve las entidades receptoras filtradas por estado.
const getCompaniesByStatus = async (status) => {
    const query = `
        SELECT companyID, status, companyName, photo 
        FROM Company 
        WHERE status = ? OR (status IS NULL OR status = "")
        ORDER BY companyName
    `;
    const [results] = await pool.query(query, [status]);
    return results;
};

// Elimina una entidad receptora según su ID.
const deleteCompany = async (companyID) => {
    const checkStatusQuery = 'SELECT companyStatus FROM Company WHERE companyID = ?';
    const deleteQuery = 'DELETE FROM Company WHERE companyID = ?';

    const [result] = await pool.query(checkStatusQuery, [companyID]);

    if (result.length === 0 || result[0].companyStatus !== 'Activo') {
        throw new Error('Solo se pueden eliminar entidades activas');
    }

    await pool.query(deleteQuery, [companyID]);
    return { message: 'Entidad receptora eliminada exitosamente' };
};

module.exports = {
    registerCompany,
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    deleteCompany
};
