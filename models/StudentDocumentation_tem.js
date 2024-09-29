const pool = require('../config/db');

// Obtener documentos por alumno y estatus
const getDocumentsByStudentAndStatus = async (studentID, status) => {
    const query = 'SELECT documentID AS id, fileName FROM StudentDocumentation WHERE studentID = ? AND status = ?';
    const [results] = await pool.query(query, [studentID, status]);
    return results;
};

// Obtener un documento por ID
const getDocumentByID = async (documentID) => {
    const query = 'SELECT file, fileName FROM StudentDocumentation WHERE documentID = ?';
    const [result] = await pool.query(query, [documentID]);
    return result.length > 0 ? result[0] : null;
};

// Contar documentos aceptados de un alumno
const countAcceptedDocuments = async (studentID) => {
    const query = 'SELECT COUNT(*) AS acceptedCount FROM StudentDocumentation WHERE studentID = ? AND status = "Accepted"';
    const [result] = await pool.query(query, [studentID]);
    return result[0];
};

// Aprobar un documento
const approveDocument = async (documentID, userType) => {
    const selectQuery = 'SELECT * FROM StudentDocumentation WHERE documentID = ?';
    const updateQuery = 'UPDATE StudentDocumentation SET status = "Accepted", userType = ? WHERE documentID = ?';
    const updateUploadedQuery = 'UPDATE StudentUploadedDocuments SET status = "Accepted" WHERE fileName = ? AND studentID = ?';
    const auditQuery = 'INSERT INTO Audit (table, action, date, userType) VALUES (?, ?, ?, ?)';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [results] = await connection.query(selectQuery, [documentID]);
        if (results.length === 0) {
            throw new Error('Documento no encontrado');
        }

        await connection.query(updateQuery, [userType, documentID]);
        await connection.query(updateUploadedQuery, [results[0].fileName, results[0].studentID]);
        await connection.query(auditQuery, ['StudentDocumentation', 'UPDATE', new Date(), userType]);

        await connection.commit();
        return { message: 'Documento aprobado exitosamente' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Rechazar un documento
const rejectDocument = async (documentID, userType) => {
    const selectQuery = 'SELECT * FROM StudentDocumentation WHERE documentID = ?';
    const deleteQuery = 'DELETE FROM StudentDocumentation WHERE documentID = ?';
    const updateUploadedQuery = 'UPDATE StudentUploadedDocuments SET status = "Rejected" WHERE fileName = ? AND studentID = ?';
    const auditQuery = 'INSERT INTO Audit (table, action, date, userType) VALUES (?, ?, ?, ?)';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [results] = await connection.query(selectQuery, [documentID]);
        if (results.length === 0) {
            throw new Error('Documento no encontrado');
        }

        await connection.query(deleteQuery, [documentID]);
        await connection.query(updateUploadedQuery, [results[0].fileName, results[0].studentID]);
        await connection.query(auditQuery, ['StudentDocumentation', 'DELETE', new Date(), userType]);

        await connection.commit();
        return { message: 'Documento rechazado exitosamente' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Eliminar un documento
const deleteDocument = async (documentID) => {
    const selectQuery = 'SELECT fileName, studentID FROM StudentDocumentation WHERE documentID = ?';
    const deleteQuery = 'DELETE FROM StudentDocumentation WHERE documentID = ?';
    const updateQuery = 'UPDATE StudentUploadedDocuments SET status = "Deleted" WHERE fileName = ? AND studentID = ?';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(selectQuery, [documentID]);
        if (result.length === 0) {
            throw new Error('Documento no encontrado');
        }

        const { fileName, studentID } = result[0];
        await connection.query(deleteQuery, [documentID]);
        await connection.query(updateQuery, [fileName, studentID]);

        await connection.commit();
        return { message: 'Documento eliminado exitosamente' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getDocumentsByStudentAndStatus,
    getDocumentByID,
    countAcceptedDocuments,
    approveDocument,
    rejectDocument,
    deleteDocument
};
