const pool = require('../config/db');
const { deleteFileFromFTP, renameFileOnFTP } = require('../utils/FtpUtils');

// Guardar un nuevo documento
const saveDocument = async (studentID, fileName, filePath, documentType, status) => {
  const query = `
    INSERT INTO StudentDocumentation (studentID, fileName, filePath, documentType, status, timestamp, recordStatus)
    VALUES (?, ?, ?, ?, ?, NOW(), 'Activo')
  `;
  await pool.query(query, [studentID, fileName, filePath, documentType, status]);
};

// Obtener documentos por alumno y estatus
const getDocumentsByStudentAndStatus = async (studentID, status) => {
    const query = `
      SELECT documentID, fileName, filePath, status, timestamp
      FROM StudentDocumentation
      WHERE studentID = ? 
        AND status = ? 
        AND recordStatus = 'Activo'
        AND status != 'Removed'
      ORDER BY timestamp DESC
    `;
    const [results] = await pool.query(query, [studentID, status]);
    return results;
};
  

// Obtener un documento por ID
const getDocumentByID = async (documentID) => {
  const query = 'SELECT fileName, filePath FROM StudentDocumentation WHERE documentID = ? AND recordStatus = "Activo"';
  const [result] = await pool.query(query, [documentID]);
  return result.length > 0 ? result[0] : null;
};

// Contar documentos aceptados
const countAcceptedDocuments = async (studentID) => {
  const query = `
    SELECT COUNT(*) AS acceptedCount 
    FROM StudentDocumentation 
    WHERE studentID = ? AND status = "Accepted" AND recordStatus = "Activo"
  `;
  const [result] = await pool.query(query, [studentID]);
  return result[0];
};

// Aprobar un documento
const approveDocument = async (documentID, userType) => {
  const selectQuery = 'SELECT * FROM StudentDocumentation WHERE documentID = ? AND recordStatus = "Activo"';
  const updateQuery = `
    UPDATE StudentDocumentation 
    SET status = "Accepted", fileName = ?, filePath = ?
    WHERE documentID = ?
  `;
  const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [results] = await connection.query(selectQuery, [documentID]);
    if (results.length === 0) throw new Error('Documento no encontrado');

    const doc = results[0];
    const newFileName = doc.fileName.replace('Pending', 'Accepted');
    const newPath = doc.filePath.replace(doc.fileName, newFileName);

    await renameFileOnFTP(doc.filePath.replace('https://uabcs.online', ''), newPath.replace('https://uabcs.online', ''));
    await connection.query(updateQuery, [newFileName, newPath, documentID]);
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

// Rechazar un documento (eliminación lógica)
const rejectDocument = async (documentID, userType) => {
    const selectQuery = 'SELECT * FROM StudentDocumentation WHERE documentID = ? AND recordStatus = "Activo"';
    const updateQuery = `
      UPDATE StudentDocumentation
      SET fileName = ?, filePath = ?, status = 'Rejected'
      WHERE documentID = ?
    `;
    const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const [results] = await connection.query(selectQuery, [documentID]);
      if (results.length === 0) throw new Error('Documento no encontrado');
  
      const doc = results[0];
      const newFileName = doc.fileName.replace('Pending', 'Rejected').replace('Accepted', 'Rejected');
      const newPath = doc.filePath.replace(doc.fileName, newFileName);
  
      await renameFileOnFTP(doc.filePath.replace('https://uabcs.online', ''), newPath.replace('https://uabcs.online', ''));
  
      await connection.query(updateQuery, [newFileName, newPath, documentID]);
      await connection.query(auditQuery, ['StudentDocumentation', 'RENAME_REJECTED', new Date(), userType]);
  
      await connection.commit();
      return { message: 'Documento rechazado y renombrado correctamente' };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
};
  

// Eliminar documento (eliminación lógica + renombramiento del archivo)
const deleteDocument = async (documentID, userType) => {
    const selectQuery = 'SELECT fileName, filePath FROM StudentDocumentation WHERE documentID = ? AND recordStatus = "Activo"';
    const updateQuery = `
      UPDATE StudentDocumentation
      SET fileName = ?, filePath = ?, status = 'Removed', recordStatus = 'Eliminado'
      WHERE documentID = ?
    `;
    const auditQuery = 'INSERT INTO Audit (`table`, action, date, userType) VALUES (?, ?, ?, ?)';
  
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const [result] = await connection.query(selectQuery, [documentID]);
      if (result.length === 0) throw new Error('Documento no encontrado');
  
      const originalName = result[0].fileName;
      const originalPath = result[0].filePath;
  
      const newFileName = originalName.replace('Pending', 'Removed').replace('Accepted', 'Removed');
      const newFilePath = originalPath.replace(originalName, newFileName);
  
      await renameFileOnFTP(originalPath.replace('https://uabcs.online', ''), newFilePath.replace('https://uabcs.online', ''));
  
      await connection.query(updateQuery, [newFileName, newFilePath, documentID]);
      await connection.query(auditQuery, ['StudentDocumentation', 'RENAME_REMOVED', new Date(), userType]);
  
      await connection.commit();
      return { message: 'Documento renombrado como eliminado exitosamente' };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  };
  

module.exports = {
  saveDocument,
  getDocumentsByStudentAndStatus,
  getDocumentByID,
  countAcceptedDocuments,
  approveDocument,
  rejectDocument,
  deleteDocument
};
