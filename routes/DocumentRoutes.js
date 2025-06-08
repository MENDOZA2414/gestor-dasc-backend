const express = require("express");
const router = express.Router();
const documentController = require("../controllers/DocumentController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const documentUploadMiddleware = require("../middlewares/DocumentUpload");

/**
 * @swagger
 * tags:
 *   name: Document
 *   description: Gestión de documentos relacionados con prácticas profesionales
 */

/**
 * @swagger
 * /api/documents/view:
 *   get:
 *     summary: Visualizar documento desde el sistema
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         description: Ruta exacta del documento a visualizar (relativa al sistema de archivos FTP)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documento visualizado correctamente
 *       404:
 *         description: Documento no encontrado
 */
router.get("/view", authMiddleware, documentController.streamDocumentByPath);

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Subir el siguiente documento requerido en el flujo de prácticas (solo alumnos)
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 description: Tipo del documento a subir (ej. cartaPresentacion)
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 *       400:
 *         description: Error en los datos enviados
 */
router.post(
  "/upload",
  authMiddleware,
  documentUploadMiddleware,
  documentController.uploadStudentDocument
);

module.exports = router;
