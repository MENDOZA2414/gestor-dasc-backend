const express = require("express");
const router = express.Router();
const documentController = require("../controllers/DocumentController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const documentUploadMiddleware = require("../middlewares/DocumentUpload");

// Subida general de documentos (archivos FTP), protegida por token
router.post("/upload", authMiddleware, documentController.uploadGeneralDocument);

// Vista de documentos por tipo de usuario
router.get("/view", authMiddleware, documentController.streamDocumentByPath);

// Subir el siguiente documento requerido en el flujo de prácticas (solo estudiantes)
router.post(
  '/upload/next',
  authMiddleware,
  documentUploadMiddleware,
  documentController.uploadNextDocument
);

module.exports = router;
