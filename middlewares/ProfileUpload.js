const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Almacenamiento en memoria
const storage = multer.memoryStorage();

// Configuración de multer para aceptar solo ciertos tipos de imágenes
const uploadProfile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return cb(new Error("Solo se permiten imágenes"), false);
    }
    cb(null, true);
  }
}).single("photo"); 

// Middleware para generar UUID y asignar nombre + buffer al req
const profileUploadMiddleware = (req, res, next) => {
  uploadProfile(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Si no hay archivo, permitimos continuar (la foto es opcional)
    if (!req.file) {
      req.generatedFileName = null;
      req.bufferFile = null;
      return next();
    }

    // Generar nombre único y guardar buffer
    const ext = path.extname(req.file.originalname).toLowerCase();
    const uuid = uuidv4();
    req.generatedFileName = `${uuid}${ext}`;
    req.bufferFile = req.file.buffer; // Guardamos el buffer para el FTP
    next();
  });
};

module.exports = profileUploadMiddleware;
