const pool = require('../config/db');
const { registerUser } = require('./User');
const createFtpStructure = require('../utils/FtpStructureBuilder');
const uploadToFTP = require('../utils/FtpUploader'); 
const validateInternalAssessorData = require('../utils/ValidateInternalAssessorData');
const { assignRolesToUserWithConnection } = require('../models/UserRole');

// Registrar un asesor interno
const registerInternalAssessor = async (assessorData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Validaciones de entrada
        validateInternalAssessorData(assessorData);

        const {
            email, password, phone,
            firstName, firstLastName, secondLastName,
            profilePhotoName, profilePhotoBuffer,
            internalAssessorStatus = 'Activo'
        } = assessorData;

        const userID = await registerUser(connection, email, password, phone, 1); // 1 Tipo: Asesor Interno

        // Asignar rol por defecto: Usuario (roleID = 3)
        await assignRolesToUserWithConnection(connection, userID, [3]);

        // Insertar con photo = null inicialmente
        const insertQuery = `
            INSERT INTO InternalAssessor (
                userID, firstName, firstLastName, secondLastName, photo, internalAssessorStatus
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertQuery, [
            userID, firstName, firstLastName, secondLastName, null, internalAssessorStatus
        ]);

        const [[{ internalAssessorID }]] = await connection.query("SELECT LAST_INSERT_ID() AS internalAssessorID");

        await connection.commit();

        // Crear carpeta FTP
        await createFtpStructure("internalAssessor", internalAssessorID);

        // Subir imagen si existe
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
                await pool.query("UPDATE InternalAssessor SET photo = ? WHERE internalAssessorID = ?", [
                    photoUrl,
                    internalAssessorID
                ]);
            } catch (err) {
                console.warn("Asesor registrado, pero falló la subida de la foto:", err.message);
            }
        }

        return { message: 'Asesor interno registrado exitosamente' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Obtener un asesor interno por ID
const getInternalAssessorByID = async (internalAssessorID) => {
    const query = 'SELECT * FROM InternalAssessor WHERE internalAssessorID = ? AND recordStatus = "Activo"';
    const [results] = await pool.query(query, [internalAssessorID]);
    if (results.length > 0) {
        return results[0];
    } else {
        return null;
    }
};

// Obtener todos los asesores internos
const getAllInternalAssessors = async () => {
    const query = 'SELECT internalAssessorID, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS fullName FROM InternalAssessor WHERE recordStatus = "Activo"';
    const [results] = await pool.query(query);
    return results;
};

// Contar el número de asesores internos
const countInternalAssessors = async () => {
  const query = 'SELECT COUNT(*) as total FROM InternalAssessor WHERE recordStatus = "Activo"';
  const [results] = await pool.query(query);
  return results[0];
};

// Eliminar lógicamente un asesor interno y su usuario
const deleteInternalAssessor = async (internalAssessorID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT userID FROM InternalAssessor WHERE internalAssessorID = ? AND recordStatus = "Activo"',
            [internalAssessorID]
        );

        if (rows.length === 0) throw new Error('El asesor interno no existe o ya fue eliminado');

        const { userID } = rows[0];

        await connection.query(
            'UPDATE InternalAssessor SET recordStatus = "Eliminado" WHERE internalAssessorID = ?',
            [internalAssessorID]
        );

        await connection.query(
            'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
            [userID]
        );

        await connection.commit();
        return { message: 'Asesor interno y usuario marcados como eliminados' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Actualizar datos del asesor interno
const patchInternalAssessor = async (internalAssessorID, updateData) => {
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
        UPDATE InternalAssessor 
        SET ${setClause} 
        WHERE internalAssessorID = ? AND recordStatus = 'Activo'
    `;

    values.push(internalAssessorID);

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
        throw new Error("No se pudo actualizar el asesor o ya fue eliminado");
    }

    return { message: "Asesor interno actualizado correctamente" };
};

module.exports = {
    registerInternalAssessor,
    getInternalAssessorByID,
    getAllInternalAssessors,
    countInternalAssessors,
    deleteInternalAssessor,
    patchInternalAssessor
};
