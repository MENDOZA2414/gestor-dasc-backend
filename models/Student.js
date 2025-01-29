const pool = require('../config/db');
const { registerUser } = require('./User');

// Registrar un alumno
const registerStudent = async (studentData) => {
    const connection = await pool.getConnection(); // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const {
            email,
            password,
            phone,
            firstName,
            firstLastName,
            secondLastName,
            dateOfBirth,
            career,
            semester,
            shift,
            controlNumber,
            studentStatus,
            status,
            internalAssessorID,
            photo
        } = studentData;

        // Verificar si el número de control ya existe
        const checkControlNumberQuery = 'SELECT * FROM Student WHERE controlNumber = ?';
        const [existingStudent] = await connection.query(checkControlNumberQuery, [controlNumber]);
        if (existingStudent.length > 0) {
            throw new Error('El número de control ya está registrado');
        }

        // **Verificar si el internalAssessorID existe**
        const checkAssessorQuery = 'SELECT * FROM InternalAssessor WHERE internalAssessorID = ?';
        const [existingAssessor] = await connection.query(checkAssessorQuery, [internalAssessorID]);
        if (existingAssessor.length === 0) {
            throw new Error('El asesor interno no existe');
        }

        // Validar formato del número de control (solo números y longitud específica)
        if (!/^\d+$/.test(controlNumber) || controlNumber.length !== 8) {
            throw new Error('El número de control debe ser un número de 8 dígitos');
        }

        // Continúa con el registro del usuario y el estudiante...
        const userID = await registerUser(connection, email, password, phone, 3); 

        const query = `
            INSERT INTO Student (controlNumber, userID, firstName, firstLastName, secondLastName, dateOfBirth, career, semester, shift, studentStatus, status, internalAssessorID, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [
            controlNumber, userID, firstName, firstLastName, secondLastName, dateOfBirth, career, semester, shift, studentStatus, status, internalAssessorID, photo
        ]);

        await connection.commit(); // Confirmar la transacción
        return { message: 'Alumno registrado exitosamente' };

    } catch (error) {
        await connection.rollback(); // Revertir la transacción si hay error
        throw error;
    } finally {
        connection.release(); // Liberar la conexión
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
