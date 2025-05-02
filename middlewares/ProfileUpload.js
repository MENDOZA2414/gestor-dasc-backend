const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../images/profile"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uuid = uuidv4();
    req.generatedFileName = `${uuid}${ext}`;
    cb(null, req.generatedFileName);
  }
});

const uploadProfile = multer({ storage }).single("profile");

module.exports = uploadProfile;
