const pool = require('../config/db');
const { deleteFileFromFTP, renameFileOnFTP } = require('../utils/FtpUtils');

// Guardar un nuevo documento
const saveDocument = async (data) => {
  const { studentID, documentType, fileName, filePath } = data;

  const insertQuery = `
    INSERT INTO StudentDocumentation (
      studentID, documentType, fileName, filePath, status, recordStatus, uploadDate
    ) VALUES (?, ?, ?, ?, 'Pendiente', 'Activo', NOW())
  `;

  await pool.query(insertQuery, [studentID, documentType, fileName, filePath]);

  return { message: 'Documento registrado correctamente' };
};

// Obtener documentos por estudiante y estatus
const getDocumentsByStudentAndStatus = async (studentID, status) => {
  const query = `
    SELECT documentID, studentID, documentType, fileName, filePath, status
    FROM StudentDocumentation
    WHERE studentID = ? AND status = ? AND recordStatus = 'Activo'
  `;
  const [rows] = await pool.query(query, [studentID, status]);
  return rows;
};

// Obtener documento por ID
const getDocumentByID = async (documentID) => {
  const query = `
    SELECT documentID, studentID, documentType, fileName, filePath, status
    FROM StudentDocumentation
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;
  const [rows] = await pool.query(query, [documentID]);
  return rows[0];
};

// Contar cuántos documentos tiene el estudiante con status Aceptado
const countAcceptedDocuments = async (studentID) => {
  const query = `
    SELECT COUNT(*) AS count
    FROM StudentDocumentation
    WHERE studentID = ? AND status = 'Aceptado' AND recordStatus = 'Activo'
  `;
  const [[result]] = await pool.query(query, [studentID]);
  return result.count;
};

// Aprobar un documento
const approveDocument = async (documentID, fileName, filePath) => {
  const query = `
    UPDATE StudentDocumentation
    SET status = 'Aceptado', fileName = ?, filePath = ?
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;
  await pool.query(query, [fileName, filePath, documentID]);
  return { message: 'Documento aprobado correctamente' };
};

// Rechazar un documento
const rejectDocument = async (documentID, fileName, filePath) => {
  const query = `
    UPDATE StudentDocumentation
    SET status = 'Rechazado', fileName = ?, filePath = ?
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;
  await pool.query(query, [fileName, filePath, documentID]);
  return { message: 'Documento rechazado correctamente' };
};

// Eliminar un documento (eliminar lógico)
const deleteDocument = async (documentID, fileName, filePath) => {
  const query = `
    UPDATE StudentDocumentation
    SET recordStatus = 'Eliminado', fileName = ?, filePath = ?
    WHERE documentID = ?
  `;
  await pool.query(query, [fileName, filePath, documentID]);
  return { message: 'Documento eliminado correctamente' };
};

// Editar metadatos de un documento existente (actualización parcial)
const patchDocument = async (documentID, updateData) => {
  const fields = [];
  const values = [];

  if (updateData.documentType) {
    fields.push("documentType = ?");
    values.push(updateData.documentType);
  }
  if (updateData.fileName) {
    fields.push("fileName = ?");
    values.push(updateData.fileName);
  }
  if (updateData.filePath) {
    fields.push("filePath = ?");
    values.push(updateData.filePath);
  }
  if (updateData.status) {
    fields.push("status = ?");
    values.push(updateData.status);
  }

  if (fields.length === 0) {
    throw new Error("No se proporcionaron campos válidos para actualizar");
  }

  const query = `
    UPDATE StudentDocumentation
    SET ${fields.join(", ")}
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;

  values.push(documentID);

  const [result] = await pool.query(query, values);

  if (result.affectedRows === 0) {
    throw new Error('No se pudo actualizar el documento');
  }

  return { message: 'Documento actualizado correctamente' };
};

module.exports = {
  saveDocument,
  getDocumentsByStudentAndStatus,
  getDocumentByID,
  countAcceptedDocuments,
  approveDocument,
  rejectDocument,
  deleteDocument,
  patchDocument
};
