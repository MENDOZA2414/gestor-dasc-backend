const multer = require('multer');
const storage = multer.memoryStorage();
const documentUploadMiddleware = multer({ storage }).single('file');

module.exports = documentUploadMiddleware;
