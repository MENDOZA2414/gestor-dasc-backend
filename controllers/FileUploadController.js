const uploadToFTP = require("../middleware/uploadFile");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage }).single("file");

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

const uploadGeneralDocument = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) return res.status(400).json({ error: "Error al procesar archivo" });

    const { userType, userID, tipoDocumento } = req.body;
    if (!userType || !userID || !tipoDocumento || !req.file)
      return res.status(400).json({ error: "Datos incompletos" });

    const valid = pathsByUserType[userType];
    if (!valid || !valid.includes(tipoDocumento))
      return res.status(400).json({ error: "Tipo de documento no permitido para este usuario" });

    const routeMap = {
      student: `alumnos/alumno_${userID}`,
      internalAssessor: `asesores_internos/asesor_${userID}`,
      externalAssessor: `asesores_externos/asesor_${userID}`,
      entity: `entidades/entidad_${userID}`,
      admin: `formatos/${tipoDocumento}`
    };

    const localPath = req.file.path;

    const safeFileName = req.file.originalname
      .replace(/\s+/g, "_")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]/g, "");

    const ftpPath = `/practicas/${routeMap[userType]}/${tipoDocumento}/${safeFileName}`;

    try {
      console.log("Ruta LOCAL:", localPath);
      console.log("Ruta FTP final:", ftpPath);
      await uploadToFTP(localPath, ftpPath);

      if (userType === "student") {
        try {
          const [[studentRow]] = await db.query(`
            SELECT studentID FROM Student WHERE userID = ?
          `, [userID]);
      
          if (!studentRow) {
            return res.status(404).json({ error: "Alumno no encontrado para este usuario" });
          }
      
          const studentID = studentRow.studentID;
      
          await db.query(`
            INSERT INTO StudentDocumentation (studentID, fileName, filePath, documentType, status, timestamp)
            VALUES (?, ?, ?, ?, 'pendiente', NOW())
          `, [
            studentID,
            req.file.originalname,
            `https://uabcs.online${ftpPath}`,
            "Local" // Siempre que sube el alumno
          ]);
        } catch (dbError) {
          console.error("Error al insertar en la base de datos:", dbError);
          return res.status(500).json({ error: "Archivo subido pero falló el registro en base de datos" });
        }
      }        

      res.status(200).json({
        message: "Archivo subido correctamente",
        ftpPath: `https://uabcs.online${ftpPath}`
      });
    } catch (error) {
      res.status(500).json({ error: "Error al subir archivo al FTP" });
    }
  });
};

module.exports = { uploadGeneralDocument };
