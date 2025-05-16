const pool = require('../config/db');
const {renameFileOnFTP } = require('../utils/FtpUtils');

// Guardar un nuevo documento
const saveDocument = async (data) => {
  const { studentID, documentType, fileName, filePath } = data;

  const insertQuery = `
    INSERT INTO StudentDocumentation (
      studentID, documentType, fileName, filePath, status, recordStatus
    ) VALUES (?, ?, ?, ?, 'Pendiente', 'Activo')
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
  console.log("🛠️ fileName recibido:", fileName);
  console.log("🛠️ filePath recibido:", filePath);

  if (!fileName || !filePath) {
    throw new Error("fileName o filePath están indefinidos");
  }

  const newFileName = fileName.replace("EnRevision", "Aceptado");
  const oldFtpPath = filePath.replace("https://uabcs.online/practicas", "");
  const newFtpPath = oldFtpPath.replace(fileName, newFileName);
  const newFilePath = `https://uabcs.online/practicas${newFtpPath}`;

  await renameFileOnFTP(oldFtpPath, newFtpPath);

  const query = `
    UPDATE StudentDocumentation
    SET status = 'Aceptado', fileName = ?, filePath = ?
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;
  await pool.query(query, [newFileName, newFilePath, documentID]);

  return { message: "Documento aprobado correctamente" };
};

// Rechazar un documento
const rejectDocument = async (documentID, fileName, filePath) => {
  const newFileName = fileName.replace("EnRevision", "Rechazado");
  const newFilePath = filePath.replace(fileName, newFileName);

  const oldFtpPath = filePath.replace("https://uabcs.online/practicas", "");
  const newFtpPath = newFilePath.replace("https://uabcs.online/practicas", "");

  await renameFileOnFTP(oldFtpPath, newFtpPath);

  const query = `
    UPDATE StudentDocumentation
    SET status = 'Rechazado', fileName = ?, filePath = ?
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;
  await pool.query(query, [newFileName, newFilePath, documentID]);

  return { message: "Documento rechazado correctamente" };
};

// Marcar un documento como EnRevisión
const markAsInReview = async (documentID, fileName, filePath) => {
  const newFileName = fileName.replace("Pendiente", "EnRevision");

  const oldFtpPath = filePath.replace("https://uabcs.online/practicas", ""); 
  const newFtpPath = oldFtpPath.replace(fileName, newFileName);

  const newFilePath = `https://uabcs.online/practicas${newFtpPath}`; 

  await renameFileOnFTP(oldFtpPath, newFtpPath);

  const updateQuery = `
    UPDATE StudentDocumentation
    SET fileName = ?, filePath = ?, status = 'EnRevision'
    WHERE documentID = ? AND recordStatus = 'Activo'
  `;

  await pool.query(updateQuery, [newFileName, newFilePath, documentID]);

  return { message: 'Documento enviado a revisión correctamente' };
};

// Eliminar un documento (eliminar lógico)
const deleteDocument = async (documentID, fileName, filePath) => {
  if (!fileName || !filePath) {
    throw new Error("Faltan datos para renombrar el archivo en el FTP.");
  }

  const newFileName = fileName.replace(/(Pendiente|EnRevision|Aceptado|Rechazado)/, "Eliminado");
  const newFilePath = filePath.replace(fileName, newFileName);
  const ftpOldPath = filePath.replace("https://uabcs.online/practicas", "");
  const ftpNewPath = newFilePath.replace("https://uabcs.online/practicas", "");

  try {
    await renameFileOnFTP(ftpOldPath, ftpNewPath);
  } catch (err) {
    console.warn("⚠️ No se pudo renombrar el archivo en el FTP:", err.message);
    // Aún así se procede a marcar como eliminado en la BD
  }

  const query = `
    UPDATE StudentDocumentation
    SET fileName = ?, filePath = ?, status = 'Eliminado', recordStatus = 'Eliminado'
    WHERE documentID = ?
  `;

  await pool.query(query, [newFileName, newFilePath, documentID]);

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
  markAsInReview,
  deleteDocument,
  patchDocument
};
