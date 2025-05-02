const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

const uploadToFTP = async (localFilePath, ftpPath) => {
  const client = new ftp.Client();
  try {
    await client.access({
      host: "uabcs.online",
      user: "practicas@uabcs.online",
      password: "G1vNRIluN.k5",
      port: 21,
      secure: false
    });

    const remoteDir = path.posix.dirname(ftpPath);
    const remoteFile = path.posix.basename(ftpPath);
    const dirs = remoteDir.split("/");

    // Empieza desde raíz
    await client.cd("/");

    // Crear subdirectorios solo si no existen
    for (const dir of dirs) {
      if (dir.trim() !== "") {
        try {
          await client.cd(dir); // Si existe, entra
        } catch {
          await client.send(`MKD ${dir}`); // Si no existe, crea
          await client.cd(dir); // Luego entra
        }
      }
    }

    await client.uploadFrom(localFilePath, remoteFile);
    console.log("Archivo subido correctamente");
  } catch (err) {
    console.error("Error al subir archivo:", err);
    throw err;
  } finally {
    client.close();
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

module.exports = uploadToFTP;
