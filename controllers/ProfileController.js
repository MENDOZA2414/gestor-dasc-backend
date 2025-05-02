const path = require("path");
const db = require("../config/db");
const uploadToFTP = require("../utils/FtpUploader");

const userTypeMap = {
  1: { table: "InternalAssessor", column: "photo" },
  2: { table: "Student", column: "photo" },
  3: { table: "ExternalAssessor", column: "photo" },
  4: { table: "Company", column: "photo" }
};

const uploadProfilePhoto = async (req, res) => {
  const { userID } = req.body;

  if (!req.bufferFile || !req.generatedFileName) {
    return res.status(400).json({ error: "Archivo de imagen no recibido correctamente" });
  }

  try {
    const [[user]] = await db.query("SELECT userTypeID FROM User WHERE userID = ?", [userID]);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const mapping = userTypeMap[user.userTypeID];
    if (!mapping) {
      return res.status(400).json({ error: "Tipo de usuario no válido" });
    }

    const table = mapping.table;
    const column = mapping.column;

    // Obtener ruta de la foto anterior
    const [[existing]] = await db.query(
      `SELECT ${column} FROM ${table} WHERE userID = ?`,
      [userID]
    );

    // Verificar si la foto existe antes de intentar eliminarla
    if (existing?.[column]) {
      const oldFilePath = path.posix.join("/", existing[column].replace("https://uabcs.online", ""));

      try {
        // Intentar eliminar la foto anterior si existe en FTP
        await uploadToFTP(oldFilePath, oldFilePath, { overwrite: true });
      } catch (err) {
        console.log("No se encontró la foto anterior en FTP. Continuamos con la subida.");
      }
    }

    // Subir nueva foto al FTP
    const remotePath = `/images/profiles/${req.generatedFileName}`;
    const publicUrl = `https://uabcs.online${remotePath}`;

    // Subir archivo al FTP
    await uploadToFTP(req.bufferFile, remotePath, { overwrite: true });

    // Actualizar la URL en la base de datos
    await db.query(`UPDATE ${table} SET ${column} = ? WHERE userID = ?`, [publicUrl, userID]);

    res.status(200).json({ message: "Foto de perfil actualizada", photo: publicUrl });
  } catch (error) {
    console.error("Error al subir la foto de perfil:", error);
    res.status(500).json({ error: "Error al actualizar la foto de perfil" });
  }
};

module.exports = { uploadProfilePhoto };
