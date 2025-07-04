const pool = require('../config/db');
const { registerUser } = require('./User');
const validateStudentData = require('../utils/validators/ValidateStudentData');
const { createFtpStructure } = require('../utils/FtpStructureBuilder');
const { assignRolesToUserWithConnection } = require('../models/UserRole');

const uploadToFTP = require('../utils/FtpUploader'); 


// Registrar un nuevo alumno
const registerStudent = async (studentData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validaciones de entrada
    validateStudentData(studentData);

    const {
      email, password, phone,
      firstName, firstLastName, secondLastName,
      dateOfBirth, career, semester, shift,
      controlNumber, status, internalAssessorID
    } = studentData;

    // Validar duplicado
    const [existingStudent] = await connection.query(
      'SELECT * FROM Student WHERE controlNumber = ?',
      [controlNumber]
    );
    if (existingStudent.length > 0) {
      throw new Error('El número de control ya está registrado');
    }

    // Validar existencia del asesor interno
    const [existingAssessor] = await connection.query(
      `SELECT * FROM InternalAssessor 
      WHERE internalAssessorID = ? 
        AND status = 'Aceptado' 
        AND recordStatus = 'Activo'`,
      [internalAssessorID]
    );
    if (existingAssessor.length === 0) {
      throw new Error('El asesor interno no está disponible o ha sido rechazado.');
    }

    // Registrar usuario
    const userID = await registerUser(connection, email, password, phone, 2); // 2 Tipo: Alumno

    // Asignar rol por defecto: Usuario (roleID = 3)
    await assignRolesToUserWithConnection(connection, userID, [3]);

    const generatedFileName = studentData.profilePhotoName || null;
    const bufferFile = studentData.profilePhotoBuffer || null;

    // Insertar alumno
    const insertQuery = `
      INSERT INTO Student (
        controlNumber, userID, firstName, firstLastName, secondLastName, 
        dateOfBirth, career, semester, shift, status, internalAssessorID, photo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertQuery, [
      controlNumber, userID, firstName, firstLastName, secondLastName,
      dateOfBirth, career, semester, shift,
      status, internalAssessorID,
      generatedFileName || null
    ]);

    const [[{ studentID }]] = await connection.query("SELECT LAST_INSERT_ID() AS studentID");

    await connection.commit();

    // Crear estructura en FTP
    await createFtpStructure("student", studentID);

    // Subir foto si existe
    if (bufferFile && generatedFileName) {
      const safeFileName = generatedFileName
        .replace(/\s+/g, "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "");

      const ftpPhotoPath = `/images/profiles/${safeFileName}`;
      const photoUrl = `https://uabcs.online/practicas${ftpPhotoPath}`;

      try {
        await uploadToFTP(bufferFile, ftpPhotoPath, { overwrite: true });
        await connection.query(`UPDATE Student SET photo = ? WHERE studentID = ?`, [photoUrl, studentID]);
      } catch (err) {
        console.warn("Alumno registrado, pero falló la subida de la foto:", err.message);
      }
    }

    return { message: 'Alumno registrado exitosamente' };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Obtener alumnos del asesor autenticado (por su ID)
const getStudentsByAssessorLogged = async (internalAssessorID) => {
  const query = `
    SELECT 
      studentID,
      controlNumber AS matricula,
      CONCAT(firstName, ' ', firstLastName, ' ', secondLastName) AS name,
      career,
      semester,
      shift
    FROM Student
    WHERE internalAssessorID = ? AND recordStatus = 'Activo'
    ORDER BY firstName
  `;
  const [results] = await pool.query(query, [internalAssessorID]);
  return results;
};

// Obtener el perfil del estudiante autenticado
const getStudentByUserID = async (userID) => {
  const query = 'SELECT * FROM Student WHERE userID = ? AND recordStatus = "Activo"';
  const [rows] = await pool.query(query, [userID]);
  return rows[0];
};

// Obtener un alumno por su controlNumber
const getStudentByControlNumber = async (controlNumber) => {
    const query = 'SELECT * FROM Student WHERE controlNumber = ? AND recordStatus = "Activo"';
    const [results] = await pool.query(query, [controlNumber]);
    if (results.length > 0) {
        return results[0];
    } else {
        throw new Error('No existe el alumno');
    }
};

// Obtener alumnos asignados a un asesor interno
const getStudentsByInternalAssessorID = async (internalAssessorID) => {
    const query = 'SELECT controlNumber, firstName, shift, career FROM Student WHERE internalAssessorID = ? AND recordStatus = "Activo"';
    const [results] = await pool.query(query, [internalAssessorID]);
    return results;
};

// Obtener todos los alumnos asignados a un asesor interno (nombre y numero de control)
const getAllStudents = async (internalAssessorID) => {
    const query = `
        SELECT controlNumber, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS name
        FROM Student
        WHERE internalAssessorID = ? AND recordStatus = "Activo"
        ORDER BY firstName;
    `;
    const [results] = await pool.query(query, [internalAssessorID]);
    return results;
};

// Contar alumnos en el sistema
const countStudents = async () => {
    const query = 'SELECT COUNT(*) as count FROM Student WHERE recordStatus = "Activo"';
    const [results] = await pool.query(query);
    return results[0].count;
};

// Obtener alumnos por estatus y asesor interno ID
const getStudentsByStatusAndAssessorID = async (status, internalAssessorID) => {
    let query = 'SELECT studentID, status, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS name FROM Student WHERE recordStatus = "Activo"';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (internalAssessorID) {
        query += ' AND internalAssessorID = ?';
        params.push(internalAssessorID);
    }

    query += ' ORDER BY firstName';

    const [results] = await pool.query(query, params);
    return results;
};

// Obtener todos los alumnos por estatus del estudiante
const getStudentsByStatus = async (status) => {
  const query = `
    SELECT studentID, controlNumber, firstName, firstLastName, secondLastName, career, semester, shift
    FROM Student
    WHERE status = ? AND recordStatus = "Activo"
    ORDER BY firstName
  `;
  const [results] = await pool.query(query, [status]);
  return results;
};

// Eliminar lógicamente un alumno y su usuario vinculado
const deleteStudentByControlNumber = async (controlNumber) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT studentID, userID FROM Student WHERE controlNumber = ? AND recordStatus = "Activo"',
      [controlNumber]
    );

    if (rows.length === 0) throw new Error('El alumno no existe o ya fue eliminado');

    const { userID } = rows[0];

    await connection.query(
      'UPDATE Student SET recordStatus = "Eliminado" WHERE controlNumber = ?',
      [controlNumber]
    );

    await connection.query(
      'UPDATE User SET recordStatus = "Eliminado" WHERE userID = ?',
      [userID]
    );

    await connection.commit();
    return { message: 'Alumno y usuario marcados como eliminados' };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Actualizar datos de un alumno si está activo
const patchStudent = async (controlNumber, fieldsToUpdate) => {
  const keys = Object.keys(fieldsToUpdate);
  const values = Object.values(fieldsToUpdate);

  if (keys.length === 0) throw new Error("No se proporcionaron campos");

  const setClause = keys.map(key => `${key} = ?`).join(", ");
  const query = `UPDATE Student SET ${setClause} WHERE controlNumber = ? AND recordStatus = 'Activo'`;

  values.push(controlNumber);

  const [result] = await pool.query(query, values);

  if (result.affectedRows === 0) throw new Error("Alumno no encontrado o ya eliminado");

  return { message: "Alumno actualizado correctamente" };
};

// Reasignar un asesor interno a un alumno
const reassignAssessor = async (controlNumber, internalAssessorID) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que el alumno exista y esté activo
    const [studentRows] = await connection.query(
      'SELECT * FROM Student WHERE controlNumber = ? AND recordStatus = "Activo"',
      [controlNumber]
    );
    if (studentRows.length === 0) {
      throw new Error('Alumno no encontrado o eliminado');
    }

    // Verificar que el asesor sea válido y esté disponible
    const [assessorRows] = await connection.query(
      'SELECT * FROM InternalAssessor WHERE internalAssessorID = ? AND status = "Aceptado" AND recordStatus = "Activo"',
      [internalAssessorID]
    );
    if (assessorRows.length === 0) {
      throw new Error('Asesor interno no válido o no disponible');
    }

    // Reasignar asesor
    await connection.query(
      'UPDATE Student SET internalAssessorID = ? WHERE controlNumber = ?',
      [internalAssessorID, controlNumber]
    );

    await connection.commit();
    return { message: 'Asesor interno reasignado correctamente' };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
    registerStudent,
    getStudentsByAssessorLogged,
    getStudentByUserID,
    getStudentByControlNumber,
    getStudentsByInternalAssessorID,
    getAllStudents,
    getStudentsByStatusAndAssessorID,
    getStudentsByStatus,
    countStudents,
    deleteStudentByControlNumber,
    patchStudent,
    reassignAssessor
};
