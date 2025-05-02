const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
const { Readable } = require("stream"); 
const ftpConfig = require("../config/ftpConfig");

const uploadToFTP = async (source, ftpPath, options = { overwrite: false }) => {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);

    const remoteDir = path.posix.dirname(ftpPath);
    const remoteFile = path.posix.basename(ftpPath);
    const dirs = remoteDir.split("/");

    await client.cd("/");

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

    const existingFiles = await client.list();
    const alreadyExists = existingFiles.some(file => file.name === remoteFile);

    if (alreadyExists && !options.overwrite) {
      throw new Error(`Ya existe un archivo con el nombre '${remoteFile}' en la ruta '${remoteDir}'.`);
    }

    if (alreadyExists && options.overwrite) {
      await client.remove(remoteFile);
    }

    // Subir desde Buffer o desde archivo local
    if (Buffer.isBuffer(source)) {
      const stream = Readable.from(source); 
      await client.uploadFrom(stream, remoteFile);
    } else {
      await client.uploadFrom(source, remoteFile);
    }

    console.log("Archivo subido correctamente");
  } catch (err) {
    console.error("Error al subir archivo:", err);
    throw err;
  } finally {
    client.close();

    // Eliminar temporal solo si es ruta local
    if (typeof source === "string" && fs.existsSync(source)) {
      fs.unlinkSync(source);
    }
  }
};

module.exports = uploadToFTP;
