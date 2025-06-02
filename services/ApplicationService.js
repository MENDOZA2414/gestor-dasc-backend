const pool = require('../config/db');
const StudentApplication = require('../models/StudentApplication');
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");
const ProfessionalPractice = require("../models/ProfessionalPractice");

const ApplicationService = {};

// Paso 1: Obtener información completa de la postulación
ApplicationService.getFullApplicationData = async (applicationID) => {
  const [[data]] = await pool.query(`
    SELECT 
      SA.studentID,
      SA.coverLetterFileName,
      SA.coverLetterFilePath,
      SA.practicePositionID,
      S.controlNumber,
      P.positionName,
      C.companyID
    FROM StudentApplication SA
    JOIN Student S ON SA.studentID = S.studentID
    JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
    JOIN Company C ON P.companyID = C.companyID
    WHERE SA.applicationID = ?
  `, [applicationID]);

  return data;
};

// Paso 2: Validar si la vacante tiene cupo disponible
ApplicationService.validateVacancyAvailability = async (practicePositionID) => {
  const [[vacancy]] = await pool.query(
    'SELECT currentStudents, maxStudents FROM PracticePosition WHERE practicePositionID = ?',
    [practicePositionID]
  );

  if (!vacancy) {
    throw new Error('La vacante no existe.');
  }

  if (vacancy.currentStudents >= vacancy.maxStudents) {
    return false; // Sin cupo
  }

  return true; // Sí hay cupo
};

/**
 * Renombra el archivo de carta de presentación en el servidor FTP
 * @param {Object} params - Parámetros necesarios
 * @param {string} params.controlNumber - Número de control del estudiante
 * @param {string} params.originalStatus - Estado anterior (Pendiente, Aceptado, etc.)
 * @param {string} params.newStatus - Estado nuevo
 * @param {number} params.companyID - ID de la empresa
 * @returns {Object} - { newFileName, newFilePath }
 */
const renameCoverLetterFile = async ({ controlNumber, originalStatus, newStatus, companyID }) => {
  const oldFileName = `carta_presentacion_${controlNumber}_${originalStatus}.pdf`;
  const newFileName = `carta_presentacion_${controlNumber}_${newStatus}.pdf`;

  const oldPath = `/practices/company/company_${companyID}/documents/${oldFileName}`;
  const newPath = `/practices/company/company_${companyID}/documents/${newFileName}`;

  const client = new ftp.Client();

  try {
    await client.access(ftpConfig);

    // Intentar renombrar usando el status actual
    await client.rename(oldPath, newPath);
    client.close();

    return {
      newFileName,
      newFilePath: `https://uabcs.online/practicas${newPath}`
    };
  } catch (err) {
    // Si no existe, intentamos con fallback (usualmente desde "Pendiente")
    const fallbackStatus = originalStatus === "Preaceptado" ? "Pendiente" : null;

    if (fallbackStatus) {
      const fallbackOldFileName = `carta_presentacion_${controlNumber}_${fallbackStatus}.pdf`;
      const fallbackOldPath = `/practices/company/company_${companyID}/documents/${fallbackOldFileName}`;

      try {
        await client.rename(fallbackOldPath, newPath);
        client.close();

        return {
          newFileName,
          newFilePath: `https://uabcs.online/practicas${newPath}`
        };
      } catch (fallbackError) {
        client.close();
        throw new Error(`Error al renombrar archivo en FTP (fallback): ${fallbackError.message}`);
      }
    }

    client.close();
    throw new Error(`Error al renombrar archivo en FTP: ${err.message}`);
  }
};

const createPracticeFromApplication = async (studentID, companyID, externalAssessorID, positionTitle, startDate, endDate, applicationID) => {
  // Verificar que no exista una práctica activa
  const [[existingPractice]] = await pool.query(`
    SELECT practiceID FROM ProfessionalPractice
    WHERE studentID = ? AND recordStatus = 'Activo'
  `, [studentID]);

  if (existingPractice) return;

  // Crear práctica profesional
  await ProfessionalPractice.createPractice({
    studentID,
    companyID,
    externalAssessorID: externalAssessorID || null,
    positionTitle: positionTitle || 'Practicante',
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDate || null
  });

  // Aumentar currentStudents en la vacante
  await pool.query(`
    UPDATE PracticePosition
    SET currentStudents = currentStudents + 1
    WHERE companyID = ? AND positionName = ?
  `, [companyID, positionTitle]);

  // Rechazar automáticamente otras postulaciones activas
  await pool.query(`
    UPDATE StudentApplication
    SET status = 'Rechazado',
        statusHistory = CONCAT(IFNULL(statusHistory, ''), ', Rechazado (${new Date().toISOString().split("T")[0]})')
    WHERE studentID = ? AND applicationID != ? AND status = 'Pendiente' AND recordStatus = 'Activo'
  `, [studentID, applicationID]);

  console.log("Práctica profesional creada y otras postulaciones rechazadas.");
};

module.exports = {
  renameCoverLetterFile,
  createPracticeFromApplication,
};
