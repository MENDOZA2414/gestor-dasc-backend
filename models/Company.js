// Modelo para gestionar las entidades receptoras (Company) en la base de datos.

const pool = require('../config/db');
const { registerUser } = require('./User');
const uploadToFTP = require('../utils/FtpUploader'); 
const createFtpStructure = require('../utils/FtpStructureBuilder');
const validateCompanyData = require('../utils/ValidateCompanyData');
const { assignRolesToUserWithConnection } = require('../models/UserRole');


// Registra una nueva entidad receptora en la base de datos.
const registerCompany = async (companyData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Asegurar que status no sea vacío
        if (!companyData.status || companyData.status.trim() === "") {
            companyData.status = "Pendiente";
        }
      
        // Validaciones de entrada
        validateCompanyData(companyData);
 
        
        const {
            email, password, phone,
            rfc, fiscalName, companyName, address, externalNumber,
            interiorNumber, suburb, city, state, zipCode,
            companyPhone, category, areaID, website,
            companyStatus = 'Activo', status = 'Pendiente',
            profilePhotoName, profilePhotoBuffer,
            needs, modality, economicSupport
        } = companyData;


        if (!rfc || !fiscalName || !companyName) {
            throw new Error('RFC, nombre fiscal y nombre de la empresa son obligatorios');
        }

        const userID = await registerUser(connection, email, password, phone, 4); // 4 Tipo: Entidad Receptora

        // Asignar rol por defecto: Usuario (roleID = 3)
        await assignRolesToUserWithConnection(connection, userID, [3]);

            // Insertar con photo = null temporalmente
            const insertQuery = `
                INSERT INTO Company (
                    userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber,
                    suburb, city, state, zipCode, companyPhone, category, areaID, website,
                    companyStatus, status, photo, needs, modality, economicSupport
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
    
            await connection.query(insertQuery, [
                userID, rfc, fiscalName, companyName, address, externalNumber, interiorNumber,
                suburb, city, state, zipCode, companyPhone, category, areaID, website,
                companyStatus, status, null, needs, modality, economicSupport
            ]);
    

        const [[{ companyID }]] = await connection.query("SELECT LAST_INSERT_ID() AS companyID");

        await connection.commit(); // Confirmar transacción primero

        // Crear carpeta FTP
        await createFtpStructure("company", companyID);

        // Subir imagen de perfil si existe
        if (profilePhotoBuffer && profilePhotoName) {
            const safeFileName = profilePhotoName
                .replace(/\s+/g, "_")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w.-]/g, "");

            const ftpPath = `/images/profiles/${safeFileName}`;
            const photoUrl = `https://uabcs.online/practicas${ftpPath}`;

            try {
                await uploadToFTP(profilePhotoBuffer, ftpPath, { overwrite: true });
                await pool.query("UPDATE Company SET photo = ? WHERE companyID = ?", [
                    photoUrl,
                    companyID
                ]);
            } catch (err) {
                console.warn("Empresa registrada, pero falló la subida de la foto:", err.message);
            }
        }

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
    const query = 'SELECT * FROM Company WHERE companyID = ? AND recordStatus = "Activo"';
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
        WHERE recordStatus = "Activo"
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
        WHERE (status = ? OR status IS NULL OR status = '') AND recordStatus = "Activo"
        ORDER BY companyName
    `;
    const [results] = await pool.query(query, [status]);
    return results;
};

// Elimina lógicamente una entidad receptora y su usuario vinculado.
const deleteCompany = async (companyID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT userID, companyStatus FROM Company WHERE companyID = ? AND recordStatus = "Activo"',
            [companyID]
        );

        if (rows.length === 0 || rows[0].companyStatus !== 'Activo') {
            throw new Error('Solo se pueden eliminar entidades activas');
        }

        const { userID } = rows[0];

        await connection.query(
            'UPDATE Company SET recordStatus = "Eliminado" WHERE companyID = ?',
            [companyID]
        );

        await connection.query(
            'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
            [userID]
        );

        await connection.commit();
        return { message: 'Entidad receptora marcada como eliminada' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Actualiza los datos de una entidad receptora por su ID.
const patchCompany = async (companyID, updateData) => {
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    const keys = Object.keys(updateData);
    const values = [];

    const setClause = keys.map(key => {
        values.push(updateData[key]);
        return `${key} = ?`;
    }).join(", ");

    const query = `
        UPDATE Company 
        SET ${setClause} 
        WHERE companyID = ? AND recordStatus = 'Activo'
    `;

    values.push(companyID);

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("No se pudo actualizar la entidad o ya fue eliminada");
    }

    return { message: "Entidad receptora actualizada correctamente" };
};

// Cuenta el número total de entidades receptoras activas.
const countCompanies = async () => {
  const query = 'SELECT COUNT(*) AS total FROM Company WHERE recordStatus = "Activo"';
  const [results] = await pool.query(query);
  return results[0]; 
};

module.exports = {
    registerCompany,
    getCompanyByID,
    getAllCompanies,
    getCompaniesByStatus,
    deleteCompany,
    patchCompany,
    countCompanies
};
