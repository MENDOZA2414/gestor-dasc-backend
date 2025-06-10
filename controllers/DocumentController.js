const uploadToFTP = require("../utils/FtpUploader");
const createFtpStructure = require("../utils/FtpStructureBuilder");
const multer = require("multer");
const path = require("path");
const pool  = require("../config/db");
const ftpConfig = require("../config/ftpConfig");
const ftp = require("basic-ftp");
const StudentDocumentation = require("../models/StudentDocumentation");

const storage = multer.memoryStorage(); // Guardar archivo en memoria

const { v4: uuidv4 } = require('uuid');

// Stream de un documento PDF desde el FTP
const streamDocumentByPath = async (req, res) => {
  const { path: filePath, download } = req.query;

  if (!filePath) {
    return res.status(400).json({ message: "Falta el parámetro 'path'" });
  }

  const fullFtpPath = path.posix.join("/", filePath);

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access(ftpConfig);

    res.setHeader("Content-Type", "application/pdf");

    // Solo si se desea forzar descarga
    if (download === "true") {
    const original = path.basename(fullFtpPath);

      // Limpiar nombre (eliminar UUID y mantener solo el tipo + estado + fecha)
      const cleanName = original
        .replace(/_[a-f0-9\-]{36}\.pdf$/, ".pdf"); // Elimina el UUID

      res.setHeader("Content-Disposition", `attachment; filename="${cleanName}"`);
    }

    // Crear stream desde el FTP hacia la respuesta HTTP
    await client.downloadTo(res, fullFtpPath);

  } catch (err) {
    console.error("Error al descargar desde FTP:", err.message);
    res.status(500).json({ message: "Error al acceder o enviar el documento", error: err.message });
  } finally {
    client.close();
  }
};

// Subir el siguiente documento requerido por el estudiante
const uploadStudentDocument = async (req, res) => {
  const client = new ftp.Client();
  try {
    // Log para depuración
    console.log('req.user:', req.user);

    const userID = req.user.id;
    // Acepta variantes de nombre de campo por si el JWT tiene otro nombre
    const userTypeID = req.user.userTypeID || req.user.type || req.user.role;

    let documentType = req.body.documentType || req.body.tipoDocumento;
    if (typeof documentType === 'string') {
      documentType = documentType.trim();
    }

    // Nuevo: obtener studentID según el tipo de usuario
    let studentID, controlNumber;

    if (userTypeID === 2) {
      // Alumno: obtiene su propio studentID
      const [[studentRow]] = await pool.query(
        'SELECT studentID, controlNumber FROM Student WHERE userID = ? AND recordStatus = "Activo"',
        [userID]
      );
      if (!studentRow) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
      studentID = studentRow.studentID;
      controlNumber = studentRow.controlNumber;
    } else if (userTypeID === 1 || userTypeID === 3 || userTypeID === 99) {
      // Admin, Super Admin o AdminOnly: debe enviar studentID en el body
      studentID = req.body.studentID;
      if (!studentID) {
        return res.status(400).json({ message: 'Falta el parámetro studentID para admin/super admin' });
      }
      // Opcional: obtener controlNumber si lo necesitas
      const [[studentRow]] = await pool.query(
        'SELECT controlNumber FROM Student WHERE studentID = ? AND recordStatus = "Activo"',
        [studentID]
      );
      if (!studentRow) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
      controlNumber = studentRow.controlNumber;
    } else {
      return res.status(403).json({ message: 'No tienes permisos para subir documentos', userTypeID });
    }

    if (!req.file || !documentType) {
      return res.status(400).json({ message: 'Faltan el archivo o el tipo de documento' });
    }

    // Sanitizar SOLO para nombre del archivo
    const sanitizeForFile = (s) =>
      s.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_');

    const safeFileType = sanitizeForFile(documentType);
    const fecha = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

    const fileName = `${safeFileType}_Pendiente_${fecha}_${uuidv4()}.pdf`;
    const fullPath = `/practices/students/student_${studentID}/documents/${fileName}`;
    const fullURL = `https://uabcs.online/practicas${fullPath}`;

    // Guardar en base de datos (con documentType original)
    const result = await StudentDocumentation.saveDocument({
      studentID,
      documentType,
      fileName,
      filePath: fullURL,
      status: 'Pendiente'
    });

    // Subir al FTP
    await uploadToFTP(req.file.buffer, fullPath);

    res.status(201).json({
      message: `Documento ${documentType} subido exitosamente`,
      data: result
    });

  } catch (err) {
    console.error('Error general al subir documento:', err.message);

    // Intentar rollback FTP
    try {
      const fullPath = req.file?.originalname || 'no-path-defined';
      await client.access(ftpConfig);
      await client.remove(fullPath);
    } catch (_) {
      console.warn('No se pudo eliminar el archivo en rollback');
    }

    res.status(500).json({ message: 'Error al subir documento', error: err.message });
  } finally {
    client.close();
  }
};

module.exports = {
  streamDocumentByPath,
  uploadStudentDocument
};