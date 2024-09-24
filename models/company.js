const pool = require('../config/db');
const { registerUser } = require('./users');

// Register a company (Receiving Entity)
const registerCompany = async (companyData) => {
    const connection = await pool.getConnection();  // Get the connection
    try {
        // Start the transaction
        await connection.beginTransaction();

        const { email, password, phone, rfc, fiscalName, companyName, street, externalNumber, internalNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, status, photo } = companyData;

        // First, register the user in the 'User' table
        const userID = await registerUser(connection, email, password, phone, 3); // Here 3 would be the roleID for a receiving entity

        // Insert into the 'Company' table
        const query = `
            INSERT INTO Company (
                userID, rfc, fiscalName, companyName, street, externalNumber, internalNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, status, photo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            userID, rfc, fiscalName, companyName, street, externalNumber, internalNumber, suburb, city, state, zipCode, companyPhone, category, areaID, website, status, photo
        ]);

        // Confirm the transaction
        await connection.commit();
        return { message: 'Receiving Entity successfully registered' };

    } catch (error) {
        // Roll back the transaction in case of error
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Release the connection
    }
};

// Get a receiving entity by ID
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
        throw new Error('Receiving entity does not exist');
    }
};

// Get all receiving entities
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

// Get receiving entities by status
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

// Delete a receiving entity by ID
const deleteCompany = async (companyID) => {
    const checkStatusQuery = 'SELECT status FROM Company WHERE companyID = ?';
    const deleteQuery = 'DELETE FROM Company WHERE companyID = ?';

    const [result] = await pool.query(checkStatusQuery, [companyID]);

    if (result.length > 0 && result[0].status === 'Accepted') {
        await pool.query(deleteQuery, [companyID]);
        return { message: 'Company successfully deleted' };
    } else {
        throw new Error('Only accepted entities can be deleted');
    }
};

module.exports = {
    registerCompany,
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    deleteCompany
};
