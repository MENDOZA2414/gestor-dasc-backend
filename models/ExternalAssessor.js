// Modelo para gestionar las operaciones de asesores externos.

const pool = require('../config/db');
const { registerUser } = require('./User');
const uploadToFTP = require('../utils/FtpUploader');
const createFtpStructure = require('../utils/FtpStructureBuilder');
const { assignRolesToUserWithConnection } = require('../models/UserRole');


// Registrar un asesor externo
const registerExternalAssessor = async (assessorData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            email, password, phone,
            firstName, firstLastName, secondLastName,
            companyID, professionID, position,
            profilePhotoName, profilePhotoBuffer
        } = assessorData;

        if (!email || !password || !firstName || !firstLastName || !companyID) {
            throw new Error('Datos obligatorios faltantes para registrar el asesor externo');
        }

        const userID = await registerUser(connection, email, password, phone, 3); // 3 Tipo: Asesor Externo

        // Asignar rol por defecto: Usuario (roleID = 3)
        await assignRolesToUserWithConnection(connection, userID, [3]);

        // Insertar con photo temporal
        const insertQuery = `
            INSERT INTO ExternalAssessor (
                userID, companyID, firstName, firstLastName, secondLastName,
                professionID, position, phone, photo, ExternalAssessorStatus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertQuery, [
            userID, companyID, firstName, firstLastName, secondLastName,
            professionID, position, phone, null, 'Activo'
        ]);

        const [[{ externalAssessorID }]] = await connection.query("SELECT LAST_INSERT_ID() AS externalAssessorID");

        await connection.commit();

        // Crear estructura FTP
        await createFtpStructure("externalAssessor", externalAssessorID);

        // Subir foto de perfil si existe
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
                await pool.query("UPDATE ExternalAssessor SET photo = ? WHERE externalAssessorID = ?", [
                    photoUrl,
                    externalAssessorID
                ]);
            } catch (err) {
                console.warn("Asesor externo registrado, pero falló la subida de la foto:", err.message);
            }
        }

        return { message: 'Asesor externo registrado exitosamente' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Obtener un asesor externo por ID
const getExternalAssessorByID = async (externalAssessorID) => {
    const query = 'SELECT * FROM ExternalAssessor WHERE externalAssessorID = ? AND recordStatus = "Activo"';
    const [results] = await pool.query(query, [externalAssessorID]);

    if (results.length === 0) {
        throw new Error('El asesor externo no existe');
    }

    return results[0];
};

// Obtener todos los asesores externos
const getAllExternalAssessors = async () => {
    const query = `
        SELECT 
            externalAssessorID, 
            CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName, 
            companyID, 
            position 
        FROM ExternalAssessor
        WHERE recordStatus = "Activo"
        ORDER BY firstName
    `;
    const [results] = await pool.query(query);
    return results;
};

// Obtener asesores externos por empresa
const getExternalAssessorsByCompanyID = async (companyID) => {
    const query = `
        SELECT 
            externalAssessorID, 
            CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName, 
            position 
        FROM ExternalAssessor
        WHERE companyID = ? AND recordStatus = "Activo"
        ORDER BY firstName
    `;
    const [results] = await pool.query(query, [companyID]);

    if (results.length === 0) {
        throw new Error('No se encontraron asesores externos para esta empresa');
    }

    return results;
};

// Actualizar un asesor externo
const patchExternalAssessor = async (externalAssessorID, updateData) => {
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
        UPDATE ExternalAssessor
        SET ${setClause}
        WHERE externalAssessorID = ? AND recordStatus = 'Activo'
    `;

    values.push(externalAssessorID);

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("No se pudo actualizar el asesor externo o ya fue eliminado");
    }

    return { message: "Asesor externo actualizado correctamente" };
};

// Eliminar lógicamente un asesor externo
const deleteExternalAssessor = async (externalAssessorID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT userID FROM ExternalAssessor WHERE externalAssessorID = ? AND recordStatus = "Activo"',
            [externalAssessorID]
        );

        if (rows.length === 0) {
            throw new Error('El asesor externo no existe o ya fue eliminado');
        }

        const { userID } = rows[0];

        await connection.query(
            'UPDATE ExternalAssessor SET recordStatus = "Eliminado" WHERE externalAssessorID = ?',
            [externalAssessorID]
        );

        await connection.query(
            'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
            [userID]
        );

        await connection.commit();
        return { message: 'Asesor externo y usuario marcados como eliminados' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Contar asesores externos
const countExternalAssessors = async () => {
  const query = 'SELECT COUNT(*) AS total FROM ExternalAssessor WHERE recordStatus = "Activo"';
  const [results] = await pool.query(query);
  return results[0]; 
};

module.exports = {
    registerExternalAssessor,
    getExternalAssessorByID,
    getAllExternalAssessors,
    getExternalAssessorsByCompanyID,
    patchExternalAssessor,
    deleteExternalAssessor,
    countExternalAssessors
};
