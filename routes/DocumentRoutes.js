const express = require("express");
const router = express.Router();
const documentController = require("../controllers/DocumentController");
const authMiddleware = require("../middlewares/AuthMiddleware");

// Subida general de documentos (archivos FTP), protegida por token
router.post("/upload", authMiddleware, documentController.uploadGeneralDocument);

// Vista de documentos por tipo de usuario
router.get("/view", authMiddleware, documentController.streamDocumentByPath);

// Para prueba de vista de documentos
//router.get('/view', documentController.streamDocumentByPath);
module.exports = router;
