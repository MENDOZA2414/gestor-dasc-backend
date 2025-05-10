const StudentApplication = require('../models/StudentApplication');
const uploadToFTP = require('../utils/FtpUploader');
const path = require('path');
const db = require('../config/db');
const createFtpStructure = require('../utils/FtpStructureBuilder');

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

// Rechazar (eliminar) una postulación por ID
exports.rejectApplication = async (req, res) => {
    try {
      const { applicationID } = req.body;
      const deleted = await StudentApplication.rejectApplication(applicationID);
  
      if (!deleted) {
        res.status(404).json({ message: 'No se encontró la postulación' });
      } else {
        res.status(200).json({ message: 'Postulación eliminada con éxito' });
      }
    } catch (error) {
      console.error('Error al eliminar la postulación:', error.message);
      res.status(500).json({ message: 'Error en el servidor al eliminar la postulación', error: error.message });
    }
};
  
// Aceptar una postulación:
exports.acceptApplication = async (req, res) => {
  try {
    const { applicationID } = req.body;
    const result = await StudentApplication.acceptApplication(applicationID);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al aceptar postulación:', error.message);
    res.status(500).json({ 
      message: 'Error en el servidor al registrar la práctica profesional',
      error: error.message
    });
  }
};


// Registrar una nueva postulación y subir carta de presentación al FTP
exports.registerApplication = async (req, res) => {
  try {
    const { studentID, practicePositionID } = req.body;
    const file = req.file;

    if (!studentID || !practicePositionID || !file) {
      return res.status(400).json({ message: 'Faltan datos: studentID, practicePositionID o archivo' });
    }

    // Buscar el userID asociado al studentID
    const [[studentRow]] = await db.query(
      'SELECT userID FROM Student WHERE studentID = ?',
      [studentID]
    );

    if (!studentRow) {
      return res.status(404).json({ message: 'No se encontró el estudiante' });
    }

    const userID = studentRow.userID;

    // Crear carpeta si no existe
    await createFtpStructure('student', userID);

    // Sanitizar nombre original del archivo
    const originalName = file.originalname
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.-]/g, '');

    const fileName = `carta_presentacion_${Date.now()}_${originalName}`;
    const ftpPath = `/practices/students/student_${userID}/documents/${fileName}`;
    const fullURL = `https://uabcs.online${ftpPath}`;

    // Subir archivo al FTP
    await uploadToFTP(file.buffer, ftpPath);

    // Guardar en la base de datos
    await StudentApplication.saveApplication({
      studentID,
      practicePositionID,
      coverLetterFileName: fileName,
      coverLetterFilePath: fullURL
    });

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
