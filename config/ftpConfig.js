require("dotenv").config();

module.exports = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  port: Number(process.env.FTP_PORT || 21),
  secure: process.env.FTP_SECURE === "true"
};
