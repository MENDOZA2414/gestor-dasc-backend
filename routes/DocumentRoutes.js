const express = require("express");
const router = express.Router();
const documentController = require("../controllers/DocumentController");
const authMiddleware = require("../middlewares/AuthMiddleware");

// Subida general de documentos (archivos FTP), protegida por token
router.post("/upload", authMiddleware, documentController.uploadGeneralDocument);

module.exports = router;
