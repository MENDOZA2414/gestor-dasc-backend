const uploadToFTP = require("../utils/FtpUploader");
const createFtpStructure = require("../utils/FtpStructureBuilder");
const multer = require("multer");
const path = require("path");
const pool  = require("../config/db");
const ftpConfig = require("../config/ftpConfig");
const ftp = require("basic-ftp");
const StudentDocumentation = require("../models/StudentDocumentation");

const storage = multer.memoryStorage(); // Guardar archivo en memoria
const upload = multer({ storage }).single("file");

const { getNextRequiredDocument } = require('../services/ProgressService');
const { generateStudentDocPath } = require('../utils/FtpStructureBuilder');
const { v4: uuidv4 } = require('uuid');

// Tipos de documentos permitidos por tipo de usuario
const pathsByUserType = {
  student: [
    "perfil", "curriculums", "imss", "carta_presentacion", "carta_aceptacion",
    "carta_compromiso", "carta_terminacion", "cuestionario_satisfaccion", "informe_final",
    "mensajes", "enviados_a_entidad", "entregados_al_asesor", "reportes", "otros"
  ],
  internalAssessor: ["documentos_recibidos", "seguimiento", "reportes_firmados"],
  externalAssessor: ["documentos_entregados", "evaluaciones"],
  entity: ["documentos_recibidos", "cartas_presentacion"],
  admin: ["plantillas", "guias", "generales"]
};

// Ruta base por tipo de usuario
const routeMap = {
  student: "students/student_",
  internalAssessor: "internalAssessor/assessor_",
  externalAssessor: "externalAssessor/assessor_",
  entity: "company/company_",
  admin: "admin/"
};

// Asigna documentType según el tipo de usuario
function mapUserTypeToDocumentType(userType) {
  switch (userType) {
    case 'student': return 'Student';
    case 'internalAssessor': return 'InternalAssessor';
    case 'externalAssessor': return 'ExternalAssessor';
    case 'admin':
    case 'system': return 'System';
    default: return null;
  }
}

// Asigna status inicial según el tipo de usuario
function getInitialStatusByUserType(userType) {
  switch (userType) {
    case 'student': return 'Pendiente';
    case 'internalAssessor': return 'Aceptado';
    case 'externalAssessor': return 'EnRevision';
    case 'admin':
    case 'system': return 'Aceptado';
    default: return null;
  }
}

// Stream de un documento PDF desde el FTP
const streamDocumentByPath = async (req, res) => {
  const { path, download } = req.query;

  if (!path) {
    return res.status(400).json({ error: "La ruta del archivo es requerida (query param 'path')." });
  }

  // Seguridad básica: prevenir acceso fuera de /practices
  if (path.includes("..") || path.startsWith("/")) {
    return res.status(400).json({ error: "Ruta de archivo no válida." });
  }

  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);

    const fileName = path.split("/").pop();
    const disposition = download === "true" ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);

    const fullFtpPath = `/practices/${path}`;
    console.log(`Streaming archivo desde: ${fullFtpPath}`);

    await client.downloadTo(res, fullFtpPath);
  } catch (err) {
    if (err.code === 550) {
      // Error 550 en FTP = archivo no encontrado
      return res.status(404).json({ error: "Archivo no encontrado en el servidor." });
    }
    console.error("Error al hacer stream del documento:", err.message);
    res.status(500).json({ error: "No se pudo obtener el documento" });
  } finally {
    client.close();
  }
};

// Subir un documento general
const uploadGeneralDocument = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) return res.status(400).json({ error: "Error al procesar archivo" });

    const { id: userID, userTypeID } = req.user;
    const { tipoDocumento } = req.body;

    // Función para traducir el tipo numérico al texto usado en el sistema
    const mapUserTypeIDToType = (id) => {
      switch (id) {
        case 2: return 'student';
        case 1: return 'internalAssessor';
        case 3: return 'externalAssessor';
        case 4: return 'company';
        case 5: return 'admin';
        default: return null;
      }
    };

    const userType = mapUserTypeIDToType(userTypeID);

    if (!userType) {
      return res.status(400).json({ error: "Tipo de usuario no válido" });
    }

    if (!userType || !userID || !tipoDocumento || !req.file) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const valid = pathsByUserType[userType];
    if (!valid || !valid.includes(tipoDocumento)) {
      return res.status(400).json({ error: "Tipo de documento no permitido para este usuario" });
    }

    // Sanitizar nombre del archivo
    const safeFileName = req.file.originalname
      .replace(/\s+/g, "_")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]/g, "");

    const basePath = routeMap[userType] + userID;
    const documentType = mapUserTypeToDocumentType(userType);
    const status = getInitialStatusByUserType(userType);
    
    if (!documentType || !status) {
      return res.status(400).json({ error: "Tipo de usuario no válido para documento" });
    }

    // Construir nombre de archivo dinámico según tipo
    const documentosUnicos = [
      "imss", "carta_presentacion", "carta_aceptacion",
      "carta_compromiso", "carta_terminacion", "cuestionario_satisfaccion",
      "informe_final"
    ];

    let composedFileName = "";
    let controlNumber = null;
    let studentID = null;

    if (userType === "student") {
      const [[studentRow]] = await pool.query(
        "SELECT studentID, controlNumber FROM Student WHERE userID = ?",
        [userID]
      );

      if (!studentRow) {
        return res.status(404).json({ error: "Alumno no encontrado para este usuario" });
      }

      controlNumber = studentRow.controlNumber;
      studentID = studentRow.studentID;

      if (documentosUnicos.includes(tipoDocumento)) {
        composedFileName = `${tipoDocumento}_${status}_${controlNumber}.pdf`;
      } else {
        composedFileName = `${tipoDocumento}_${status}_${Date.now()}_${controlNumber}.pdf`;
      }
    } else {
      if (documentosUnicos.includes(tipoDocumento)) {
        composedFileName = `${tipoDocumento}_${status}.pdf`;
      } else {
        composedFileName = `${tipoDocumento}_${status}_${Date.now()}.pdf`;
      }
    }

    const ftpPath = `/practices/${basePath}/documents/${composedFileName}`;
    const fullUrl = `https://uabcs.online/practicas${ftpPath}`;    

    let ftpSubido = false;

    try {
      // Crear carpeta si es estudiante
      if (userType === "student") {
        await createFtpStructure("student", userID);

        try {
          await StudentDocumentation.saveDocument({
            studentID,
            fileName: composedFileName,
            filePath: fullUrl,
            documentType,
            status
          });
        } catch (dbError) {
          return res.status(500).json({ error: "Error al guardar en la base de datos" });
        }
      }

      // Subir al FTP solo si la BD fue exitosa
      await uploadToFTP(req.file.buffer, ftpPath, { overwrite: true });
      ftpSubido = true;

      res.status(200).json({
        message: "Archivo subido correctamente",
        ftpPath: fullUrl
      });

    } catch (error) {
      console.error("Error al subir el archivo:", error);

      // Si el FTP se subió pero falló algo más (caso raro)
      if (ftpSubido) {
        const client = new ftp.Client();
        await client.access(ftpConfig);
        await client.remove(ftpPath);
        client.close();
      }

      res.status(500).json({ error: "Error al subir archivo o guardar en base de datos" });
    }

  });
};

// Subir el siguiente documento requerido por el estudiante
const uploadNextDocument = async (req, res) => {
  const client = new ftp.Client();
  try {
    const userID = req.user.id;
    const userTypeID = req.user.userTypeID;

    if (userTypeID !== 2) {
      return res.status(403).json({ message: 'Solo los estudiantes pueden subir documentos' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Obtener studentID real
    const [[studentRow]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );
    if (!studentRow) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    const studentID = studentRow.studentID;

    // Obtener siguiente tipo de documento
    const nextDocType = await getNextRequiredDocument(studentID);
    if (!nextDocType) {
      return res.status(400).json({ message: 'Ya has completado todos los documentos requeridos' });
    }

    // Construir nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `${nextDocType}_Pendiente_${fecha}_${uuidv4()}.pdf`;
    const fullPath = `/practices/students/student_${studentID}/documents/${fileName}`;
    const fullURL = `https://uabcs.online/practicas${fullPath}`;

    // Subir al FTP
    await uploadToFTP(req.file.buffer, fullPath);

    // Guardar en base de datos
    try {
      const result = await StudentDocumentation.saveDocument({
        studentID,
        documentType: nextDocType,
        fileName,
        filePath: fullURL,
        status: 'Pendiente'
      });

      return res.status(201).json({
        message: `Documento ${nextDocType} subido exitosamente`,
        data: result
      });

    } catch (dbError) {
      // Si la BD falla, eliminar el archivo del FTP
      try {
        await client.access(ftpConfig);
        await client.remove(fullPath);
        console.warn('Se eliminó el archivo del FTP por fallo en BD');
      } catch (ftpRollbackError) {
        console.error('Error al intentar eliminar el archivo tras fallo en BD:', ftpRollbackError.message);
      }

      return res.status(500).json({
        message: 'Error al guardar el documento en la base de datos',
        error: dbError.message
      });
    }

  } catch (err) {
    console.error('Error general al subir documento:', err.message);
    return res.status(500).json({ message: 'Error general', error: err.message });
  } finally {
    client.close();
  }
};

module.exports = {
  uploadGeneralDocument,
  streamDocumentByPath,
  uploadNextDocument
};