const StudentApplication = require('../models/StudentApplication');
const ProfessionalPractice = require('../models/ProfessionalPractice');
const uploadToFTP = require('../utils/FtpUploader');
const path = require('path');
const db = require('../config/db');
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");

// Registrar una nueva postulación y subir carta de presentación al FTP
exports.registerApplication = async (req, res) => {
  try {
    const { studentID, practicePositionID, controlNumber } = req.body;

    // Verificar que la vacante esté activa
    const [[vacanteData]] = await db.query(`
      SELECT P.companyID, P.status AS positionStatus
      FROM PracticePosition P
      WHERE P.practicePositionID = ?
    `, [practicePositionID]);

    if (!vacanteData) {
      return res.status(404).json({ message: 'La vacante no existe o fue eliminada' });
    }

    console.log("Status de vacante:", vacanteData.positionStatus);

    if (vacanteData.positionStatus !== 'Aceptado') {
      return res.status(400).json({ message: 'Esta vacante no está activa para recibir postulaciones' });
    }

    const companyID = vacanteData.companyID;

        
    const file = req.file;

    if (!studentID || !practicePositionID || !companyID || !controlNumber || !file) {
      return res.status(400).json({ message: 'Faltan datos: studentID, practicePositionID, companyID, controlNumber o archivo' });
    }

    // Verificar si la vacante ya está llena (por cupo)
    const [[{ currentStudents, maxStudents }]] = await db.query(
      "SELECT currentStudents, maxStudents FROM PracticePosition WHERE practicePositionID = ?",
      [practicePositionID]
    );

    if (currentStudents >= maxStudents) {
      return res.status(400).json({ message: 'La vacante ya no acepta más postulaciones, cupo lleno' });
    }

    // Verificar si la empresa asociada está aceptada
    const [[companyData]] = await db.query(`
      SELECT C.status
      FROM PracticePosition P
      JOIN Company C ON P.companyID = C.companyID
      WHERE P.practicePositionID = ?
    `, [practicePositionID]);

    if (!companyData || companyData.status !== 'Aceptado') {
      return res.status(400).json({ message: 'La empresa asociada a esta vacante no está activa para recibir postulaciones' });
    }


    // Verificar si ya existe una postulación previa (rechazada incluida)
    const [[existingApplication]] = await db.query(`
      SELECT SA.applicationID, SA.status, SA.coverLetterFileName, P.companyID
      FROM StudentApplication SA
      JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
      WHERE SA.studentID = ? AND SA.practicePositionID = ? AND SA.recordStatus = 'Activo'
      ORDER BY SA.timestamp DESC LIMIT 1
    `, [studentID, practicePositionID]);    

    // Ruta y nombre del nuevo archivo
    const fileName = `carta_presentacion_${controlNumber}_Pendiente.pdf`;
    const ftpPath = `/practices/company/company_${companyID}/documents/${fileName}`;
    const fullURL = `https://uabcs.online/practicas${ftpPath}`;

    if (existingApplication) {
      if (existingApplication.status !== 'Rechazado') {
        return res.status(400).json({ message: 'Ya existe una postulación activa para esta vacante' });
      }

      // Eliminar carta anterior rechazada
      try {
        const client = new ftp.Client();
        await client.access(ftpConfig);
        const oldFilePath = `/practices/company/company_${companyID}/documents/${existingApplication.coverLetterFileName}`;
        await client.remove(oldFilePath);
        client.close();
      } catch (ftpError) {
        console.warn("No se pudo eliminar la carta anterior rechazada:", ftpError.message);
      }

      // Subir nuevo archivo con _Pendiente
      try {
        await uploadToFTP(file.buffer, ftpPath, { overwrite: false });
      } catch (ftpError) {
        return res.status(500).json({
          message: 'Error al subir el archivo al servidor FTP',
          error: ftpError.message
        });
      }

      // Actualizar postulación y statusHistory
      const [[{ statusHistory }]] = await db.query(`
        SELECT statusHistory FROM StudentApplication WHERE applicationID = ?
      `, [existingApplication.applicationID]);

      const today = new Date().toISOString().split("T")[0];
      const entry = `Pendiente (${today})`;

      await StudentApplication.patchApplication(existingApplication.applicationID, {
        status: 'Pendiente',
        coverLetterFileName: fileName,
        coverLetterFilePath: fullURL,
        statusHistory: statusHistory ? `${statusHistory}, ${entry}` : entry
      });

      return res.status(200).json({
        message: 'Postulación actualizada tras rechazo',
        filePath: fullURL
      });
    }

    // Verificar existencia previa (rechazados sí se permiten)
    const alreadyApplied = await StudentApplication.verifyStudentApplication(studentID, practicePositionID);
    if (alreadyApplied) {
      return res.status(400).json({ message: 'Ya existe una postulación activa para esta vacante' });
    }

    try {
      const client = new ftp.Client();
      await client.access(ftpConfig);
      await client.remove(ftpPath); // Si ya existe, se elimina
      client.close();
    } catch (ftpError) {
      console.warn("No se eliminó archivo previo (posiblemente no existía):", ftpError.message);
    }

    // Eliminar carta anterior rechazada si existe (mismo alumno y vacante)
    const rejectedFileName = `carta_presentacion_${controlNumber}_Rechazado.pdf`;
    const rejectedPath = `/practices/company/company_${companyID}/documents/${rejectedFileName}`;
    try {
      const client = new ftp.Client();
      await client.access(ftpConfig);
      await client.remove(rejectedPath); // eliminar archivo anterior
      client.close();
    } catch (ftpError) {
      console.warn("Archivo rechazado anterior no encontrado o ya eliminado:", ftpError.message);
    }

    // Subir nuevo archivo con _Pendiente
    try {
      await uploadToFTP(file.buffer, ftpPath, { overwrite: false });
    } catch (ftpError) {
      return res.status(500).json({
        message: 'Error al subir el archivo al servidor FTP',
        error: ftpError.message
      });
    }

    // Guardar postulación en la BD
    try {
      await StudentApplication.saveApplication({
        studentID,
        practicePositionID,
        coverLetterFileName: fileName,
        coverLetterFilePath: fullURL
      });
    } catch (dbError) {
      // Si falla la BD, eliminar el archivo subido para evitar basura en FTP
      try {
        const client = new ftp.Client();
        await client.access(ftpConfig);
        await client.remove(ftpPath);
        client.close();
      } catch (cleanupError) {
        console.warn("Error al limpiar archivo tras fallo en BD:", cleanupError.message);
      }
      throw dbError;
    }

    res.status(201).json({
      message: 'Postulación registrada correctamente',
      filePath: fullURL
    });
  } catch (error) {
    console.error('Error al registrar la postulación:', error.message);
    res.status(500).json({
      message: 'Error en el servidor al registrar la postulación',
      error: error.message
    });
  }
};

// Obtener todas las postulaciones por ID de vacante
exports.getApplicationsByPositionID = async (req, res) => {
    try {
      const positionID = req.params.positionID;
      const applications = await StudentApplication.getApplicationsByPositionID(positionID);

      if (applications.length > 0) {
        res.status(200).json(applications);
      } else {
        res.status(404).json({ message: 'No hay postulaciones registradas para esta vacante' });
      }
    } catch (error) {
      console.error('Error en la consulta de postulaciones:', error.message);
      res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

// Obtener el nombre y la URL de la carta de presentación por ID de postulación
exports.getCoverLetterByID = async (req, res) => {
    try {
      const applicationID = req.params.id;
      const data = await StudentApplication.getCoverLetterByID(applicationID);

      if (data) {
        res.status(200).json({
          fileName: data.coverLetterFileName,
          filePath: data.coverLetterFilePath
        });
      } else {
        res.status(404).json({ message: 'No se encontró la carta de presentación' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};

// Verificar si un estudiante ya se ha postulado a una vacante específica
exports.verifyStudentApplication = async (req, res) => {
    try {
      const { studentID, positionID } = req.params;
      const hasApplied = await StudentApplication.verifyStudentApplication(studentID, positionID);
      res.status(200).json({ applied: hasApplied });
    } catch (error) {
      console.error('Error verificando postulación:', error.message);
      res.status(500).json({ error: 'Error verificando postulación' });
    }
};

// Obtener todas las postulaciones realizadas por un estudiante
exports.getApplicationsByStudentID = async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const applications = await StudentApplication.getApplicationsByStudentID(studentID);
      res.status(200).json(applications);
    } catch (error) {
      console.error('Error obteniendo postulaciones:', error.message);
      res.status(500).json({ error: 'Error obteniendo postulaciones' });
    }
};

// Obtener todas las postulaciones recibidas por una empresa (entidad receptora)
exports.getApplicationsByCompanyID = async (req, res) => {
  try {
    const companyID = req.params.companyID;
    const applications = await StudentApplication.getApplicationsByCompanyID(companyID);

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No hay postulaciones registradas para esta empresa' });
    }

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error al obtener postulaciones por empresa:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar una postulación existente (aceptar o rechazar con renombrado y validación de cupo)
exports.patchApplicationController = async (req, res) => {
  try {
    const applicationID = req.params.applicationID;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    if (updateData.status && ["Aceptado", "Rechazado"].includes(updateData.status)) {
      const [[data]] = await db.query(`
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

      if (!data) {
        return res.status(404).json({ message: "Datos de postulación no encontrados" });
      }

      // Validar cupo antes de aceptar
      if (updateData.status === "Aceptado") {
        const [[{ currentStudents, maxStudents }]] = await db.query(
          "SELECT currentStudents, maxStudents FROM PracticePosition WHERE practicePositionID = ?",
          [data.practicePositionID]
        );

        if (currentStudents >= maxStudents) {
          return res.status(400).json({ message: "La vacante ya alcanzó su máximo de estudiantes aceptados" });
        }
      }

      // Renombrar archivo en FTP
      // Capturar estado original antes del update
      const [[{ status: originalStatus }]] = await db.query(`
        SELECT status FROM StudentApplication WHERE applicationID = ?
      `, [applicationID]);
      
      // Construir rutas de archivos
      const oldFileName = `carta_presentacion_${data.controlNumber}_${originalStatus}.pdf`;
      const oldPath = `/practices/company/company_${data.companyID}/documents/${oldFileName}`;

      const newFileName = `carta_presentacion_${data.controlNumber}_${updateData.status}.pdf`;
      const newPath = `/practices/company/company_${data.companyID}/documents/${newFileName}`;

      // Intentar renombrar el archivo en FTP
      try {
        const client = new ftp.Client();
        await client.access(ftpConfig);
        await client.rename(oldPath, newPath);
        client.close();
      } catch (ftpError) {
        console.warn("No se pudo renombrar el archivo en FTP:", ftpError.message);
        return res.status(500).json({
          message: "No se pudo renombrar el archivo. La operación fue cancelada.",
          error: ftpError.message
        });
      }

      // Actualizar campos en la BD
      updateData.coverLetterFileName = newFileName;
      updateData.coverLetterFilePath = `https://uabcs.online/practicas${newPath}`;

      // Actualizar el historial
      const [[{ statusHistory }]] = await db.query(`
        SELECT statusHistory FROM StudentApplication WHERE applicationID = ?
      `, [applicationID]);

      const now = new Date().toISOString().split("T")[0];
      const newEntry = `${updateData.status} (${now})`;
      updateData.statusHistory = statusHistory
        ? `${statusHistory}, ${newEntry}`
        : newEntry;

      // Crear práctica profesional solo si fue aceptado y no existe ya una
      if (updateData.status === "Aceptado") {
        const [[existingPractice]] = await db.query(`
          SELECT practiceID FROM ProfessionalPractice
          WHERE studentID = ? AND recordStatus = 'Activo'
        `, [data.studentID]);

        if (!existingPractice) {
          // Obtener fechas de la vacante
          const [[position]] = await db.query(`
            SELECT startDate, endDate, positionName, externalAssessorID
            FROM PracticePosition
            WHERE practicePositionID = ?
          `, [data.practicePositionID]);

          const positionTitle = position?.positionName || 'Practicante';
          const startDate = position?.startDate || new Date().toISOString().split("T")[0];
          const endDate = position?.endDate || null;

          await ProfessionalPractice.createPractice({
            studentID: data.studentID,
            companyID: data.companyID,
            externalAssessorID: position?.externalAssessorID || null,
            positionTitle,
            startDate,
            endDate
          });

          // Aumentar currentStudents en la vacante
          await db.query(
            "UPDATE PracticePosition SET currentStudents = currentStudents + 1 WHERE practicePositionID = ?",
            [data.practicePositionID]
          );

          console.log("Práctica profesional creada automáticamente desde postulación aceptada.");
        }
      }
    }

    const result = await StudentApplication.patchApplication(applicationID, updateData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar la postulación:', error.message);
    res.status(500).json({ message: 'Error en el servidor al actualizar la postulación', error: error.message });
  }
};
