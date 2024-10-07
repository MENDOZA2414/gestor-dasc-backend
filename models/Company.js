const pool = require('../config/db');
const { registerUser } = require('./User');

// Registrar una entidad receptora (Compañía)
const registerCompany = async (companyData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { email, password, phone, rfc, fiscalName, companyName, address, externalNumber, interiorNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, companyStatus, status, photo } = companyData;

        // Registrar primero el usuario en la tabla 'User'
        const userID = await registerUser(connection, email, password, phone, 3); // Aquí 3 sería el roleID para una entidad receptora

        // Insertar en la tabla 'Company'
        const query = `
            INSERT INTO Company (
                userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, companyStatus, status, photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, companyStatus, status, photo
        ]);

        // Confirmar la transacción
        await connection.commit();
        return { message: 'Entidad receptora registrada exitosamente' };

    } catch (error) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Liberar la conexión
    }
};

// Obtener una entidad receptora por ID
const getCompanyByID = async (companyID) => {
    const query = 'SELECT * FROM Company WHERE companyID = ?';
    const [results] = await pool.query(query, [companyID]);
    if (results.length > 0) {
        const company = results[0];
        if (company.photo) {
            company.photo = company.photo.toString('base64');
        }
        return company;
    } else {
        throw new Error('La entidad receptora no existe');
    }
};

// Obtener todas las entidades receptoras
const getAllCompanies = async () => {
    const query = `
        SELECT companyID, companyName AS name, photo AS companyLogo 
        FROM Company
        ORDER BY companyName`;

    const [results] = await pool.query(query);

    results.forEach(row => {
        if (row.companyLogo) {
            row.companyLogo = `data:image/jpeg;base64,${Buffer.from(row.companyLogo).toString('base64')}`;
        }
    });

    return results;
};

// Obtener entidades receptoras por estado
const getCompaniesByStatus = async (status) => {
    let query = 'SELECT companyID, status, companyName AS name, photo AS companyLogo FROM Company WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    } else {
        query += ' AND (status IS NULL OR status = "")';
    }

    query += ' ORDER BY companyName';

    const [results] = await pool.query(query, params);
    return results;
};

// Eliminar una entidad receptora por ID
const deleteCompany = async (companyID) => {
    const checkStatusQuery = 'SELECT companyStatus FROM Company WHERE companyID = ?';
    const deleteQuery = 'DELETE FROM Company WHERE companyID = ?';

    const [result] = await pool.query(checkStatusQuery, [companyID]);

    if (result.length > 0 && result[0].companyStatus === 'Activo') {
        await pool.query(deleteQuery, [companyID]);
        return { message: 'Compañía eliminada exitosamente' };
    } else {
        throw new Error('Solo se pueden eliminar entidades activas');
    }
};

module.exports = {
    registerCompany,
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    deleteCompany
};
