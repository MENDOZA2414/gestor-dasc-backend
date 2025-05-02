const pool = require('../config/db');
const { registerUser } = require('./User');
const validateStudentData = require('../utils/ValidateStudentData');
const createFtpStructure = require('../middleware/CreateFtpStructure');
const uploadToFTP = require('../middleware/UploadFile');
const path = require("path");
const fs = require("fs");

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
      controlNumber, studentStatus, status,
      internalAssessorID, photo
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
      'SELECT * FROM InternalAssessor WHERE internalAssessorID = ?',
      [internalAssessorID]
    );
    if (existingAssessor.length === 0) {
      throw new Error('El asesor interno no existe');
    }

    // ✅ Validar que la foto exista ANTES de registrar
    if (photo) {
      const localPhotoPath = path.join("uploads", photo);
      if (!fs.existsSync(localPhotoPath)) {
        throw new Error(`La foto de perfil "${photo}" no existe en /uploads`);
      }
    }

    // Registrar usuario
    const userID = await registerUser(connection, email, password, phone, 3);

    // Insertar alumno
    const insertQuery = `
      INSERT INTO Student (controlNumber, userID, firstName, firstLastName, secondLastName, dateOfBirth, career, semester, shift, studentStatus, status, internalAssessorID, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertQuery, [
      controlNumber, userID, firstName, firstLastName, secondLastName,
      dateOfBirth, career, semester, shift,
      studentStatus, status, internalAssessorID, photo
    ]);

    const [[{ studentID }]] = await connection.query("SELECT LAST_INSERT_ID() AS studentID");

    await connection.commit();

    // Crear estructura en FTP
    await createFtpStructure("student", studentID);

    // Subir foto si existe
    if (photo) {
      const localPhotoPath = path.join("uploads", photo);
      const safeFileName = photo
        .replace(/\s+/g, "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "");
      const ftpPhotoPath = `/practices/students/student_${studentID}/profile/${safeFileName}`;
      try {
        await uploadToFTP(localPhotoPath, ftpPhotoPath, { overwrite: true });
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

// Obtener un alumno por su controlNumber
const getStudentByControlNumber = async (controlNumber) => {
    const query = 'SELECT * FROM Student WHERE controlNumber = ?';
    const [results] = await pool.query(query, [controlNumber]);
    if (results.length > 0) {
        return results[0];
    } else {
        throw new Error('No existe el alumno');
    }
};

// Obtener alumnos asignados a un asesor interno
const getStudentsByInternalAssessorID = async (internalAssessorID) => {
    const query = 'SELECT controlNumber, firstName, shift, career FROM Student WHERE internalAssessorID = ?';
    const [results] = await pool.query(query, [internalAssessorID]);
    return results;
};

// Obtener todos los alumnos asignados a un asesor interno
const getAllStudents = async (internalAssessorID) => {
    const query = `
        SELECT controlNumber, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS name
        FROM Student
        WHERE internalAssessorID = ?
        ORDER BY firstName;
    `;
    const [results] = await pool.query(query, [internalAssessorID]);
    return results;
};

// Contar alumnos en el sistema
const countStudents = async () => {
    const query = 'SELECT COUNT(*) as count FROM Student';
    const [results] = await pool.query(query);
    return results[0].count;
};

// Obtener alumnos por estatus y asesor interno ID
const getStudentsByStatusAndAssessorID = async (status, internalAssessorID) => {
    let query = 'SELECT studentID, status, CONCAT(firstName, " ", firstLastName, " ", secondLastName) AS name FROM Student WHERE 1=1';
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

// Eliminar un alumno por su controlNumber
const deleteStudentByControlNumber = async (controlNumber) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const verifyStatusQuery = 'SELECT status FROM Student WHERE controlNumber = ?';
        const deleteStudentQuery = 'DELETE FROM Student WHERE controlNumber = ?';
        
        const [result] = await connection.query(verifyStatusQuery, [controlNumber]);

        if (result.length > 0 && result[0].status === 'Accepted') {
            await connection.query(deleteStudentQuery, [controlNumber]);
            await connection.commit();
            return { message: 'Alumno eliminado con éxito' };
        } else {
            await connection.rollback();
            throw new Error('Solo se pueden eliminar alumnos aceptados');
        }
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    registerStudent,
    getStudentByControlNumber,
    getStudentsByInternalAssessorID,
    getAllStudents,
    getStudentsByStatusAndAssessorID,
    countStudents,
    deleteStudentByControlNumber
};
