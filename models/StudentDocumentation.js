const pool = require('../config/db');

// Guardar un nuevo documento (subido por alumno)
const saveDocument = async (studentID, fileName, filePath, documentType, status) => {
    const query = `
      INSERT INTO StudentDocumentation (studentID, fileName, filePath, documentType, status, timestamp)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    await pool.query(query, [studentID, fileName, filePath, documentType, status]);
  };
  

// Obtener documentos por alumno y estatus
const getDocumentsByStudentAndStatus = async (studentID, status) => {
    const query = `
      SELECT documentID, fileName, filePath, status, timestamp
      FROM StudentDocumentation
      WHERE studentID = ? AND status = ?
      ORDER BY timestamp DESC
    `;
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
    const updateQuery = 'UPDATE StudentDocumentation SET status = "Accepted" WHERE documentID = ?';
    const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const [results] = await connection.query(selectQuery, [documentID]);
      if (results.length === 0) throw new Error('Documento no encontrado');
  
      await connection.query(updateQuery, [documentID]);
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
    const updateQuery = 'UPDATE StudentDocumentation SET status = "Rejected" WHERE documentID = ?';
    const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const [results] = await connection.query(selectQuery, [documentID]);
      if (results.length === 0) throw new Error('Documento no encontrado');
  
      await connection.query(updateQuery, [documentID]);
      await connection.query(auditQuery, ['StudentDocumentation', 'UPDATE', new Date(), userType]);
  
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
const deleteDocument = async (documentID, userType) => {
    const selectQuery = 'SELECT fileName, studentID FROM StudentDocumentation WHERE documentID = ?';
    const deleteQuery = 'DELETE FROM StudentDocumentation WHERE documentID = ?';
    const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const [result] = await connection.query(selectQuery, [documentID]);
      if (result.length === 0) throw new Error('Documento no encontrado');
  
      const { fileName, studentID } = result[0];
  
      await connection.query(deleteQuery, [documentID]);
      await connection.query(auditQuery, ['StudentDocumentation', 'DELETE', new Date(), userType]);
  
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
  deleteDocument,
  saveDocument 
};

