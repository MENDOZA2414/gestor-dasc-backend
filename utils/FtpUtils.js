const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");

// Eliminar un archivo del FTP
async function deleteFileFromFTP(path) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.remove(path);
  } catch (error) {
    console.error("Error eliminando archivo del FTP:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

// Renombrar archivo en el FTP
async function renameFileOnFTP(oldPath, newPath) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    await client.rename(oldPath, newPath);
  } catch (error) {
    console.error("Error renombrando archivo en el FTP:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

module.exports = {
  deleteFileFromFTP,
  renameFileOnFTP,
};
