const uploadToFTP = require("../utils/FtpUploader");
const createFtpStructure = require("../utils/FtpStructureBuilder");
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const ftpConfig = require("../config/ftpConfig");
const ftp = require("basic-ftp");
const StudentDocumentation = require("../models/StudentDocumentation");

const storage = multer.memoryStorage(); // Guardar archivo en memoria
const upload = multer({ storage }).single("file");

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

  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);

    const fileName = path.split("/").pop();
    const disposition = download === "true" ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);

    // Leer directamente del FTP
    await client.downloadTo(res, `/practices/${path}`);
  } catch (err) {
    console.error("Error al hacer stream del documento:", err.message);
    res.status(500).json({ error: "No se pudo obtener el documento" });
  } finally {
    client.close();
  }
};

const uploadGeneralDocument = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) return res.status(400).json({ error: "Error al procesar archivo" });

    const { userType, userID, tipoDocumento } = req.body;

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

    if (documentosUnicos.includes(tipoDocumento)) {
      composedFileName = `${tipoDocumento}_${status}.pdf`;
    } else {
      composedFileName = `${tipoDocumento}_${status}_${Date.now()}.pdf`;
    }

    const ftpPath = `/practices/${basePath}/documents/${composedFileName}`;
    const fullUrl = `https://uabcs.online/practicas${ftpPath}`;    

    try {
      // Subir archivo al FTP desde buffer
      await uploadToFTP(req.file.buffer, ftpPath, { overwrite: true });
    
      if (userType === "student") {
        const [[studentRow]] = await db.query("SELECT studentID FROM Student WHERE userID = ?", [userID]);
    
        if (!studentRow) {
          return res.status(404).json({ error: "Alumno no encontrado para este usuario" });
        }
    
        const studentID = studentRow.studentID;
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
          // Si falla la BD, borrar el archivo del FTP
          const client = new ftp.Client();
          await client.access(ftpConfig);
          await client.remove(ftpPath);
          client.close();
          throw dbError;
        }
      }
    
      res.status(200).json({
        message: "Archivo subido correctamente",
        ftpPath: fullUrl
      });
    
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      res.status(500).json({ error: "Error al subir archivo o guardar en base de datos" });
    }    
  });
};

module.exports = {
  uploadGeneralDocument,
  streamDocumentByPath
};