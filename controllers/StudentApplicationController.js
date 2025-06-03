const StudentApplication = require('../models/StudentApplication');
const ProfessionalPractice = require('../models/ProfessionalPractice');
const uploadToFTP = require('../utils/FtpUploader');
const path = require('path');
const pool  = require('../config/db');
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");
const getUserRoles = require('../utils/GetUserRoles');
const { renameCoverLetterFile, createPracticeFromApplication } = require('../services/ApplicationService');

// Registrar una nueva postulación y subir carta de presentación al FTP
exports.registerApplication = async (req, res) => {
  try {
    const { practicePositionID } = req.body;
    // Obtener studentID y controlNumber desde la tabla Student (a partir del userID autenticado)
    const [[studentRow]] = await pool.query(
      'SELECT studentID, controlNumber FROM Student WHERE userID = ?',
      [req.user.id]
    );

    if (!studentRow) {
      return res.status(404).json({ message: 'No se encontró información del estudiante.' });
    }

    const studentID = studentRow.studentID;
    const controlNumber = studentRow.controlNumber;

    if (req.user.userTypeID !== 2) {
      return res.status(403).json({ message: 'Solo los estudiantes pueden registrar postulaciones.' });
    }

    // Verificar que la vacante esté activa
    const [[vacanteData]] = await pool.query(`
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
    const [[{ currentStudents, maxStudents }]] = await pool.query(
      "SELECT currentStudents, maxStudents FROM PracticePosition WHERE practicePositionID = ?",
      [practicePositionID]
    );

    if (currentStudents >= maxStudents) {
      return res.status(400).json({ message: 'La vacante ya no acepta más postulaciones, cupo lleno' });
    }

    // Verificar si la empresa asociada está aceptada
    const [[companyData]] = await pool.query(`
      SELECT C.status
      FROM PracticePosition P
      JOIN Company C ON P.companyID = C.companyID
      WHERE P.practicePositionID = ?
    `, [practicePositionID]);

    if (!companyData || companyData.status !== 'Aceptado') {
      return res.status(400).json({ message: 'La empresa asociada a esta vacante no está activa para recibir postulaciones' });
    }


    // Verificar si ya existe una postulación previa (rechazada incluida)
    const [[existingApplication]] = await pool.query(`
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
    const positionID = parseInt(req.params.positionID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Si el usuario es una empresa, verificar que la vacante sea suya
    if (userTypeID === 4) {  // 4 = company
      const [[vacante]] = await pool.query(
        'SELECT companyID FROM PracticePosition WHERE practicePositionID = ?',
        [positionID]
      );

      if (!vacante) {
        return res.status(404).json({ message: 'La vacante no existe.' });
      }

      if (userTypeID === 4) {
        const [[empresa]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );

        if (!empresa) {
          return res.status(404).json({ message: 'No se encontró la empresa autenticada.' });
        }

        const myCompanyID = empresa.companyID;

        if (vacante.companyID !== myCompanyID) {
          return res.status(403).json({ message: 'No puedes acceder a postulaciones de vacantes que no te pertenecen.' });
        }
      }
    }

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
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    const data = await StudentApplication.getCoverLetterByID(applicationID);

    if (!data) {
      return res.status(404).json({ message: 'No se encontró la carta de presentación' });
    }

    // Obtener roles
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      if (userTypeID === 2) {
        // Obtener studentID real desde userID
        const [[student]] = await pool.query(
          'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );

        if (!student || student.studentID !== data.studentID) {
          return res.status(403).json({ message: 'No puedes acceder a la carta de otro estudiante.' });
        }
      }

      if (userTypeID === 4) {
        // Obtener companyID real desde userID
        const [[company]] = await pool.query(
          'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
          [requesterID]
        );

        if (!company || company.companyID !== data.companyID) {
          return res.status(403).json({ message: 'No puedes acceder a cartas de vacantes que no pertenecen a tu empresa.' });
        }
      }
    }

    res.status(200).json({
      fileName: data.coverLetterFileName,
      filePath: data.coverLetterFilePath
    });

  } catch (error) {
    console.error('Error al obtener carta de presentación:', error.message);
    res.status(500).json({ message: 'Error en el servidor: ' + error.message });
  }
};

// Obtener todas las postulaciones del estudiante autenticado
exports.getApplicationsByLoggedStudent = async (req, res) => {
  try {
    const userID = req.user.id;

    // Obtener el studentID a partir del userID
    const [[student]] = await pool.query(
      'SELECT studentID FROM Student WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    const applications = await StudentApplication.getApplicationsByStudentID(student.studentID);

    res.status(200).json(applications);

  } catch (error) {
    console.error('Error al obtener postulaciones del estudiante:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener todas las postulaciones de la empresa autenticada
exports.getApplicationsByMyCompany = async (req, res) => {
  try {
    const requesterID = req.user.id; // userID de la empresa

    const [[company]] = await pool.query(
      'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
      [requesterID]
    );

    if (!company) {
      return res.status(404).json({ message: 'No se encontró la empresa asociada al usuario logueado' });
    }

    const companyID = company.companyID;

    const applications = await StudentApplication.getApplicationsByCompanyID(companyID);

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No hay postulaciones registradas para tu empresa' });
    }

    res.status(200).json(applications);

  } catch (error) {
    console.error('Error al obtener postulaciones de empresa logueada:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener todas las postulaciones realizadas por un estudiante
exports.getApplicationsByStudentID = async (req, res) => {
  try {
    const studentID = parseInt(req.params.studentID);
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;

    // Obtener roles
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, debe ser el mismo estudiante
    if (!isAdmin) {
      if (userTypeID !== 2 || requesterID !== studentID) {
        return res.status(403).json({ error: 'No tienes permiso para consultar postulaciones de otro estudiante.' });
      }
    }

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
    const companyID = parseInt(req.params.companyID);
    if (isNaN(companyID)) {
      return res.status(400).json({ message: 'ID de empresa inválido' });
    }

    const applications = await StudentApplication.getApplicationsByCompanyID(companyID);

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No hay postulaciones registradas para esta empresa' });
    }

    res.status(200).json(applications);

  } catch (error) {
    console.error('Error obteniendo postulaciones por empresa:', error.message);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Obtener todas las postulaciones por estado (Aceptado, Rechazado, Pendiente)
exports.getApplicationsByStatus = async (req, res) => {
  const status = req.params.status;

  if (!['Aceptado', 'Rechazado', 'Pendiente'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }

  const [results] = await pool.query(`
    SELECT * FROM StudentApplication
    WHERE status = ? AND recordStatus = 'Activo'
  `, [status]);

  res.status(200).json(results);
};

// Actualizar una postulación existente (aceptar o rechazar con renombrado y validación de cupo)
exports.patchApplicationController = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const userTypeID = req.user.userTypeID;
    const applicationID = parseInt(req.params.applicationID);
    const updateData = req.body;

    // Obtener roles
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Validar input
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    // Validar status permitido
    const validStatuses = isAdmin
      ? ['Aceptado', 'Rechazado', 'Pendiente']
      : ['Aceptado', 'Rechazado'];

    if (!validStatuses.includes(updateData.status)) {
      return res.status(400).json({
        message: `Estado inválido. ${
          isAdmin
            ? 'Solo se permite Aceptado, Rechazado o Pendiente.'
            : 'Solo se permite Aceptado o Rechazado.'
        }`
      });
    }

    // Obtener la postulación
    const [[application]] = await pool.query(`
      SELECT SA.*, S.controlNumber, S.internalAssessorID AS assignedAssessorID,
             P.positionName, P.startDate, P.endDate, P.externalAssessorID,
             P.currentStudents, P.maxStudents, P.practicePositionID, C.companyID
      FROM StudentApplication SA
      JOIN Student S ON SA.studentID = S.studentID
      JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
      JOIN Company C ON P.companyID = C.companyID
      WHERE SA.applicationID = ? AND SA.recordStatus = 'Activo'
    `, [applicationID]);

    if (!application) {
      return res.status(404).json({ message: 'Postulación no encontrada.' });
    }

    // Solo permitir aceptar/rechazar si está Preaceptado (excepto si Admin quiere devolverla a Pendiente)
    if (updateData.status !== 'Pendiente' && application.status !== 'Preaceptado') {
      return res.status(400).json({
        message: 'Solo se puede aceptar o rechazar una postulación que esté en estado Preaceptado.'
      });
    }

    // Validar que si es asesor interno, sea el que corresponde
    if (!isAdmin && userTypeID === 1) {
      const [[internal]] = await pool.query(`
        SELECT internalAssessorID FROM InternalAssessor
        WHERE userID = ? AND recordStatus = 'Activo'
      `, [requesterID]);

      if (!internal || application.assignedAssessorID !== internal.internalAssessorID) {
        return res.status(403).json({
          message: 'Solo el asesor interno asignado al alumno puede aceptar o rechazar esta postulación.'
        });
      }
    }

    // Validar cupo si se va a aceptar
    if (updateData.status === 'Aceptado') {
      if (application.currentStudents >= application.maxStudents) {
        return res.status(400).json({
          message: 'La vacante ya alcanzó su máximo de estudiantes aceptados'
        });
      }
    }

    // Reducir currentStudents si regresa a Pendiente
    if (
      updateData.status === 'Pendiente' &&
      ['Preaceptado', 'Aceptado'].includes(application.status)
    ) {
      await pool.query(
        'UPDATE PracticePosition SET currentStudents = GREATEST(currentStudents - 1, 0) WHERE practicePositionID = ?',
        [application.practicePositionID]
      );
    }

    // Renombrar archivo en FTP (solo si el nuevo status no es Rechazado)
    if (updateData.status !== 'Rechazado') {
      try {
          const { newFileName, newFilePath } = await renameCoverLetterFile({
            controlNumber: application.controlNumber,
            originalStatus: application.status,
            newStatus: updateData.status,
            companyID: application.companyID
          });

          updateData.coverLetterFileName = newFileName;
          updateData.coverLetterFilePath = newFilePath;
        } catch (ftpError) {
          console.warn("No se pudo renombrar el archivo en FTP:", ftpError.message);
          return res.status(500).json({
            message: "No se pudo renombrar el archivo. La operación fue cancelada.",
            error: ftpError.message
          });
        }
      }

    // Modificar currentStudents solo si renombrado fue exitoso
    if (updateData.status === 'Aceptado') {
      const [[existingPractice]] = await pool.query(`
        SELECT practiceID FROM ProfessionalPractice
        WHERE studentID = ? AND recordStatus = 'Activo'
      `, [application.studentID]);

      if (!existingPractice) {
        await createPracticeFromApplication(
          application.studentID,
          application.companyID,
          application.externalAssessorID || null,
          application.positionName || 'Practicante',
          application.startDate || today,
          application.endDate || null,
          applicationID
        );

        // Aumentar el contador solo si no existía práctica
        await pool.query(
          'UPDATE PracticePosition SET currentStudents = currentStudents + 1 WHERE practicePositionID = ?',
          [application.practicePositionID]
        );
      }
    }

    if (
      updateData.status === 'Pendiente' &&
      ['Preaceptado', 'Aceptado'].includes(application.status)
    ) {
      await pool.query(
        'UPDATE PracticePosition SET currentStudents = GREATEST(currentStudents - 1, 0) WHERE practicePositionID = ?',
        [application.practicePositionID]
      );
    }

    if (
      updateData.status === 'Rechazado' &&
      ['Preaceptado', 'Aceptado'].includes(application.status)
    ) {
      await pool.query(
        'UPDATE PracticePosition SET currentStudents = GREATEST(currentStudents - 1, 0) WHERE practicePositionID = ?',
        [application.practicePositionID]
      );
    }

    // Historial
    const today = new Date().toISOString().split('T')[0];
    const newEntry = `${updateData.status} (${today})`;
    updateData.statusHistory = application.statusHistory
      ? `${application.statusHistory}, ${newEntry}`
      : newEntry;

    // Si se rechaza y antes estaba Preaceptado, reducir currentStudents
    if (updateData.status === 'Rechazado' && application.status === 'Preaceptado') {
      await pool.query(
        'UPDATE PracticePosition SET currentStudents = GREATEST(currentStudents - 1, 0) WHERE practicePositionID = ?',
        [application.practicePositionID]
      );
    }

    // Crear práctica si es Aceptado y aún no existe
    if (updateData.status === 'Aceptado') {
      const [[existingPractice]] = await pool.query(`
        SELECT practiceID FROM ProfessionalPractice
        WHERE studentID = ? AND recordStatus = 'Activo'
      `, [application.studentID]);

      if (!existingPractice) {
        await createPracticeFromApplication(
          application.studentID,
          application.companyID,
          application.externalAssessorID || null,
          application.positionName || 'Practicante',
          application.startDate || today,
          application.endDate || null,
          applicationID
        );

        // Aumentar el contador de estudiantes aceptados
        await pool.query(
          'UPDATE PracticePosition SET currentStudents = currentStudents + 1 WHERE practicePositionID = ?',
          [application.practicePositionID]
        );
      }
    }

    // Actualizar en BD
    const result = await StudentApplication.patchApplication(applicationID, updateData);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error al actualizar la postulación:', error.message);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Actualizar el estado de una postulación por parte de la empresa
exports.updateApplicationStatusByCompany = async (req, res) => {
  try {
    const applicationID = parseInt(req.params.applicationID);
    const { status } = req.body;
    const requesterID = req.user.id;

    if (!['Preaceptado', 'Rechazado'].includes(status)) {
      return res.status(400).json({
        message: 'Estado inválido. Solo se permite Preaceptado o Rechazado desde la empresa.'
      });
    }

    const [[company]] = await pool.query(
      'SELECT companyID FROM Company WHERE userID = ? AND recordStatus = "Activo"',
      [requesterID]
    );

    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada.' });
    }

    const [[application]] = await pool.query(`
      SELECT SA.*, P.companyID, P.practicePositionID, P.currentStudents, P.maxStudents,
             S.controlNumber
      FROM StudentApplication SA
      JOIN PracticePosition P ON SA.practicePositionID = P.practicePositionID
      JOIN Student S ON SA.studentID = S.studentID
      WHERE SA.applicationID = ? AND SA.recordStatus = 'Activo'
    `, [applicationID]);

    if (!application) {
      return res.status(404).json({ message: 'Postulación no encontrada.' });
    }

    if (application.companyID !== company.companyID) {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta postulación.' });
    }

    // Validar cupo y duplicados al preaceptar
    if (status === 'Preaceptado') {
      if (application.currentStudents >= application.maxStudents) {
        return res.status(400).json({
          message: 'No se puede preaceptar. La vacante ya alcanzó su máximo de estudiantes.'
        });
      }

      // Verificar que el estudiante no tenga otra postulación preaceptada o aceptada
      const [[alreadyChosen]] = await pool.query(`
        SELECT applicationID FROM StudentApplication
        WHERE studentID = ? AND status IN ('Preaceptado', 'Aceptado') AND recordStatus = 'Activo'
          AND applicationID != ?
      `, [application.studentID, applicationID]);

      if (alreadyChosen) {
        return res.status(400).json({
          message: 'Este estudiante ya tiene otra postulación preaceptada o aceptada. No se puede duplicar.'
        });
      }

      // Solo verificar que tenga CartaPresentacion aceptada
      const [[doc]] = await pool.query(`
        SELECT documentID FROM StudentDocumentation
        WHERE studentID = ? AND documentType = 'CartaPresentacion' AND status = 'Aceptado' AND recordStatus = 'Activo'
        LIMIT 1
      `, [application.studentID]);

      if (!doc) {
        return res.status(400).json({
          message: 'No se puede preaceptar. El estudiante no tiene una Carta de Presentación aceptada.'
        });
      }

      // Si pasa validaciones, aumentar el contador
      await pool.query(
        'UPDATE PracticePosition SET currentStudents = currentStudents + 1 WHERE practicePositionID = ?',
        [application.practicePositionID]
      );
    }

    // Armar historial
    const today = new Date().toISOString().split('T')[0];
    const newEntry = `${status} (${today})`;
    const updatedHistory = application.statusHistory
      ? `${application.statusHistory}, ${newEntry}`
      : newEntry;

    // Preparar objeto para actualizar
    const updateData = {
      status,
      statusHistory: updatedHistory
    };

    // Renombrar el archivo en FTP
    try {
      const { newFileName, newFilePath } = await renameCoverLetterFile({
        controlNumber: application.controlNumber,
        originalStatus: application.status,
        newStatus: status,
        companyID: application.companyID
      });

      updateData.coverLetterFileName = newFileName;
      updateData.coverLetterFilePath = newFilePath;
    } catch (ftpError) {
      console.warn("Error renombrando archivo en FTP:", ftpError.message);
    }

    // Armar SET y valores para query
    const keys = Object.keys(updateData);
    const values = keys.map(k => updateData[k]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    values.push(applicationID);

    await pool.query(
      `UPDATE StudentApplication SET ${setClause} WHERE applicationID = ?`,
      values
    );

    return res.status(200).json({ message: `Postulación actualizada a ${status}.` });

  } catch (error) {
    console.error('Error actualizando estado de postulación:', error.message);
    return res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};