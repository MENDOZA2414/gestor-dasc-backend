// utils/FtpRename.js
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");

const renameFTPFile = async (oldPath, newPath) => {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.rename(oldPath, newPath);
    console.log(`Archivo renombrado de ${oldPath} a ${newPath}`);
  } catch (err) {
    console.error("Error al renombrar archivo:", err);
    throw err;
  } finally {
    client.close();
  }
};

module.exports = renameFTPFile;
