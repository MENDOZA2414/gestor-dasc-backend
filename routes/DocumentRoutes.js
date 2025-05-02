const express = require("express");
const router = express.Router();
const fileUploadController = require("../controllers/FileUploadController");

router.post("/upload", fileUploadController.uploadGeneralDocument);

module.exports = router;
