const pool = require('../config/db');

// Obtener documentos por alumno y estatus
const obtenerDocumentosPorAlumnoYEstado = async (alumnoID, estatus) => {
    const query = 'SELECT documentoID AS id, nombreArchivo FROM documentoAlumno WHERE alumnoID = ? AND estatus = ?';
    const [results] = await pool.query(query, [alumnoID, estatus]);
    return results;
};

// Obtener un documento por ID
const obtenerDocumentoPorID = async (documentoID) => {
    const query = 'SELECT archivo, nombreArchivo FROM documentoAlumno WHERE documentoID = ?';
    const [result] = await pool.query(query, [documentoID]);
    return result.length > 0 ? result[0] : null;
};

// Contar documentos aceptados de un alumno
const contarDocumentosAceptados = async (alumnoID) => {
    const query = 'SELECT COUNT(*) AS acceptedCount FROM documentoAlumno WHERE alumnoID = ? AND estatus = "aceptado"';
    const [result] = await pool.query(query, [alumnoID]);
    return result[0];
};

// Aprobar un documento
const aprobarDocumento = async (documentId, userType) => {
    const selectQuery = 'SELECT * FROM documentoAlumno WHERE documentoID = ?';
    const updateQuery = 'UPDATE documentoAlumno SET estatus = "Aceptado", usuarioTipo = ? WHERE documentoID = ?';
    const updateSubidoQuery = 'UPDATE documentosAlumnoSubido SET estatus = "Aceptado" WHERE nombreArchivo = ? AND alumnoID = ?';
    const auditQuery = 'INSERT INTO auditoria (tabla, accion, fecha, usuarioTipo) VALUES (?, ?, ?, ?)';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [results] = await connection.query(selectQuery, [documentId]);
        if (results.length === 0) {
            throw new Error('Document not found');
        }

        await connection.query(updateQuery, [userType, documentId]);
        await connection.query(updateSubidoQuery, [results[0].nombreArchivo, results[0].alumnoID]);
        await connection.query(auditQuery, ['documentoAlumno', 'UPDATE', new Date(), userType]);

        await connection.commit();
        return { message: 'Document approved successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Rechazar un documento
const rechazarDocumento = async (documentId, userType) => {
    const selectQuery = 'SELECT * FROM documentoAlumno WHERE documentoID = ?';
    const deleteQuery = 'DELETE FROM documentoAlumno WHERE documentoID = ?';
    const updateSubidoQuery = 'UPDATE documentosAlumnoSubido SET estatus = "Rechazado" WHERE nombreArchivo = ? AND alumnoID = ?';
    const auditQuery = 'INSERT INTO auditoria (tabla, accion, fecha, usuarioTipo) VALUES (?, ?, ?, ?)';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [results] = await connection.query(selectQuery, [documentId]);
        if (results.length === 0) {
            throw new Error('Document not found');
        }

        await connection.query(deleteQuery, [documentId]);
        await connection.query(updateSubidoQuery, [results[0].nombreArchivo, results[0].alumnoID]);
        await connection.query(auditQuery, ['documentoAlumno', 'DELETE', new Date(), userType]);

        await connection.commit();
        return { message: 'Document rejected successfully' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// Eliminar un documento
const eliminarDocumento = async (documentoID) => {
    const selectQuery = 'SELECT nombreArchivo, alumnoID FROM documentoAlumno WHERE documentoID = ?';
    const deleteQuery = 'DELETE FROM documentoAlumno WHERE documentoID = ?';
    const updateQuery = 'UPDATE documentosAlumnoSubido SET estatus = "Eliminado" WHERE nombreArchivo = ? AND alumnoID = ?';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(selectQuery, [documentoID]);
        if (result.length === 0) {
            throw new Error('Documento no encontrado');
        }

        const { nombreArchivo, alumnoID } = result[0];
        await connection.query(deleteQuery, [documentoID]);
        await connection.query(updateQuery, [nombreArchivo, alumnoID]);

        await connection.commit();
        return { message: 'Documento eliminado con éxito' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerDocumentosPorAlumnoYEstado,
    obtenerDocumentoPorID,
    contarDocumentosAceptados,
    aprobarDocumento,
    rechazarDocumento,
    eliminarDocumento
};
