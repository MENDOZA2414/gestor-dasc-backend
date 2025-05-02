const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage();

const uploadProfile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return cb(new Error("Solo se permiten imágenes"), false);
    }
    cb(null, true);
  }
}).single("profile");

// Middleware para generar UUID y asignar nombre + buffer al req
const profileUploadMiddleware = (req, res, next) => {
  uploadProfile(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const uuid = uuidv4();
    req.generatedFileName = `${uuid}${ext}`;
    req.bufferFile = req.file.buffer; // Guardamos el buffer para el FTP
    next();
  });
};

module.exports = profileUploadMiddleware;
