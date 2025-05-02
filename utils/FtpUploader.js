const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const ftpConfig = require("../config/ftpConfig"); 

const uploadToFTP = async (localFilePath, ftpPath, options = { overwrite: false }) => {
  const client = new ftp.Client();
  try {
    // Conexión al servidor FTP usando configuración externa
    await client.access(ftpConfig);

    const remoteDir = path.posix.dirname(ftpPath);
    const remoteFile = path.posix.basename(ftpPath);
    const dirs = remoteDir.split("/");

    // Comienza desde la raíz
    await client.cd("/");

    // Crear subdirectorios si no existen
    for (const dir of dirs) {
      if (dir.trim() !== "") {
        try {
          await client.cd(dir);
        } catch {
          await client.send("MKD " + dir);
          await client.cd(dir);
        }
      }
    }

    // Verificar si el archivo ya existe
    const existingFiles = await client.list();
    const alreadyExists = existingFiles.some(file => file.name === remoteFile);

    // Manejo si ya existe el archivo
    if (alreadyExists && !options.overwrite) {
      throw new Error(`Ya existe un archivo con el nombre '${remoteFile}' en la ruta '${remoteDir}'.`);
    }

    // Si se permite sobreescribir, eliminar el anterior
    if (alreadyExists && options.overwrite) {
      await client.remove(remoteFile);
    }

    // Subir archivo
    await client.uploadFrom(localFilePath, remoteFile);
    console.log("Archivo subido correctamente");
  } catch (err) {
    console.error("Error al subir archivo:", err);
    throw err;
  } finally {
    client.close();

    // Eliminar archivo temporal local después de subirlo
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};

module.exports = uploadToFTP;