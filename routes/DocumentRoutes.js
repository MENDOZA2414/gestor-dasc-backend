const express = require("express");
const router = express.Router();
const documentController = require("../controllers/DocumentController");

// Subida general de documentos (archivos FTP)
router.post("/upload", documentController.uploadGeneralDocument);

module.exports = router;
