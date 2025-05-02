const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Mapea el tipo de usuario con su tabla y columna de foto
const userTypeMap = {
  1: { table: "Student", column: "photo", pk: "userID" },
  2: { table: "InternalAssessor", column: "photo", pk: "userID" },
  3: { table: "ExternalAssessor", column: "photo", pk: "userID" },
  4: { table: "Company", column: "photo", pk: "userID" }
};

const uploadProfilePhoto = async (req, res) => {
  const { userID } = req.body;

  if (!req.file || !req.generatedFileName) {
    return res.status(400).json({ error: "Archivo de imagen no recibido" });
  }

  try {
    const [[user]] = await db.query("SELECT userTypeID FROM User WHERE userID = ?", [userID]);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userTypeID = user.userTypeID;
    const mapping = userTypeMap[userTypeID];

    if (!mapping) {
      return res.status(400).json({ error: "Tipo de usuario no válido" });
    }

    const table = mapping.table;
    const column = mapping.column;

    // Obtener ruta anterior (si existe)
    const [[existing]] = await db.query(
      `SELECT ${column} FROM ${table} WHERE userID = ?`,
      [userID]
    );

    if (existing?.[column]) {
      const oldPath = path.join(__dirname, "..", existing[column]);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const newPath = `/images/profile/${req.generatedFileName}`;

    await db.query(
      `UPDATE ${table} SET ${column} = ? WHERE userID = ?`,
      [newPath, userID]
    );

    res.status(200).json({ message: "Foto de perfil actualizada", photo: newPath });
  } catch (error) {
    console.error("Error al subir la foto de perfil:", error);
    res.status(500).json({ error: "Error al actualizar la foto de perfil" });
  }
};

module.exports = { uploadProfilePhoto };
