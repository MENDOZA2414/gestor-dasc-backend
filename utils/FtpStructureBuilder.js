const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");

async function createFtpStructure(userType, id) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);

    // Mapeo de tipos de usuario a su ruta base
    const typeMap = {
      student: `students/student_${id}`,
      internalAssessor: `internalAssessor/assessor_${id}`,
      externalAssessor: `externalAssessor/assessor_${id}`,
      company: `company/company_${id}`
    };

    // Validar tipo de usuario
    if (!typeMap[userType]) {
      throw new Error(`Tipo de usuario no válido: ${userType}`);
    }

    const base = `/practices/${typeMap[userType]}`;
    const folders = [`${base}/documents`];

    // Crear las carpetas si no existen
    for (const folder of folders) {
      const parts = folder.split("/").filter(Boolean);
      await client.cd("/");
      for (let i = 0; i < parts.length; i++) {
        const path = "/" + parts.slice(0, i + 1).join("/");
        try {
          await client.cd(path);
        } catch {
          await client.send("MKD " + path);
          await client.cd(path);
        }
      }
    }

    console.log(`FTP structure created for ${userType}_${id}`);
  } catch (err) {
    console.error("Error creating FTP structure:", err);
    throw err;
  } finally {
    client.close();
  }
}

function generateStudentDocPath(studentID, fileName) {
  const fullPath = `/practices/students/student_${studentID}/documents/${fileName}`;
  const fullURL = `https://uabcs.online/practicas${fullPath}`;
  return { fullPath, fullURL };
}

module.exports = {
  createFtpStructure,
  generateStudentDocPath
};
