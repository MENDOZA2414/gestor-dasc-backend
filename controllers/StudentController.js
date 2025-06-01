const Student = require('../models/Student');
const { registerStudent, getStudentsByAssessorLogged } = require('../models/Student');
const getUserRoles = require('../utils/GetUserRoles');
const pool  = require('../config/db');

// Controlador para registrar un alumno
const registerStudentController = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FOTO GENERADA:", req.generatedFileName);
    console.log("BUFFER:", req.bufferFile ? "Sí hay foto" : "No hay foto");

    // Validación básica del campo status
    const allowedStatuses = ['Pendiente', 'Aceptado', 'Rechazado'];
    const status = req.body.status || 'Pendiente';

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'El campo "status" debe ser: Pendiente, Aceptado o Rechazado.' });
    }

    // Armar objeto studentData
    const studentData = {
      ...req.body,
      status,
      semester: req.body.semester,
      internalAssessorID: Number(req.body.internalAssessorID),
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null,
    };

    const result = await registerStudent(studentData, req.generatedFileName, req.bufferFile);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar el alumno:', error.message);

    const knownValidationErrors = [
      'El número de control',
      'El email ya está registrado',
      'El número de teléfono',
      'Formato de email',
      'Debe tener 10 dígitos',
      'Campo requerido',
      'Valor no permitido',
      'El asesor interno no existe',
    ];

    if (knownValidationErrors.some(msg => error.message.includes(msg))) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Error al registrar el alumno', error: error.message });
  }
};

// Obtener alumnos asignados al asesor interno autenticado
const getStudentsByLoggedAssessor = async (req, res) => {
  try {
    const userID = req.user.id;

    // Obtener el internalAssessorID usando el userID
    const [[assessor]] = await pool.query(
      'SELECT internalAssessorID FROM InternalAssessor WHERE userID = ? AND recordStatus = "Activo"',
      [userID]
    );

    if (!assessor) {
      return res.status(404).json({ message: 'No se encontró el asesor interno' });
    }

    const students = await Student.getStudentsByAssessorLogged(assessor.internalAssessorID);
    res.status(200).json(students);

  } catch (error) {
    console.error('Error en getStudentsByLoggedAssessor:', error.message);
    res.status(500).json({ message: 'Error al obtener los alumnos del asesor autenticado.' });
  }
};

// Obtener un alumno por controlNumber
const getStudentByControlNumber = async (req, res) => {
  const controlNumber = req.params.controlNumber;
  const requesterID = req.user.id;

  try {
    // Obtener alumno
    const student = await Student.getStudentByControlNumber(controlNumber);
    if (!student) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    // Obtener roles del usuario autenticado
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin...
    if (!isAdmin) {
      const userTypeID = req.user.userTypeID;

      // Si es estudiante, solo puede ver su propio perfil
      if (userTypeID === 2 && student.userID !== requesterID) {
        return res.status(403).json({ message: 'No puedes ver información de otro estudiante.' });
      }

      // Si es asesor interno, solo puede ver alumnos asignados a él
      if (userTypeID === 1 && student.internalAssessorID !== requesterID) {
        return res.status(403).json({ message: 'No puedes ver alumnos que no están asignados a ti.' });
      }
    }

    res.status(200).json(student);

  } catch (error) {
    console.error('Error al obtener el alumno:', error.message);
    res.status(500).json({ message: 'Error al obtener el alumno' });
  }
};

// Obtener alumnos por ID de asesor
const getStudentsByInternalAssessorID = async (req, res) => {
  const { internalAssessorID } = req.params;

  try {
    const students = await Student.getStudentsByInternalAssessorID(internalAssessorID);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error al obtener alumnos del asesor:', error.message);
    res.status(500).json({ message: 'Error interno al consultar alumnos' });
  }
};

// Obtener todos los alumnos
const getAllStudents = async (req, res) => {
  try {
    const requesterID = req.user.id;
    const roles = await getUserRoles(requesterID);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    if (!isAdmin) {
      return res.status(403).json({ message: 'No tienes permisos para ver todos los alumnos.' });
    }

    const {
      career,
      shift,
      semester,
      status,
      internalAssessorID
    } = req.query;

    let query = `
      SELECT 
        s.studentID,
        s.controlNumber AS matricula,
        CONCAT(s.firstName, ' ', s.firstLastName, ' ', s.secondLastName) AS name,
        s.career,
        s.semester,
        s.shift,
        s.status,
        CONCAT(ia.firstName, ' ', ia.firstLastName, ' ', ia.secondLastName) AS internalAssessor
      FROM Student s
      LEFT JOIN InternalAssessor ia ON s.internalAssessorID = ia.internalAssessorID
      WHERE s.recordStatus = 'Activo'
    `;

    const params = [];

    if (career) {
      query += ' AND s.career = ?';
      params.push(career);
    }

    if (shift) {
      query += ' AND s.shift = ?';
      params.push(shift);
    }

    if (semester) {
      query += ' AND s.semester = ?';
      params.push(semester);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    if (internalAssessorID) {
      query += ' AND s.internalAssessorID = ?';
      params.push(internalAssessorID);
    }

    query += ' ORDER BY s.firstName';

    const [students] = await pool.query(query, params);

    res.status(200).json(students);
  } catch (error) {
    console.error('Error en getAllStudents:', error.message);
    res.status(500).json({ message: 'Error al obtener los alumnos.' });
  }
};

// Contar alumnos en el sistema
const countStudents = async (req, res) => {
    try {
        const totalStudents = await Student.countStudents();
        res.status(200).json({ totalStudents });
    } catch (error) {
        console.error('Error al contar los alumnos:', error.message);
        res.status(500).json({ message: 'Error al contar los alumnos' });
    }
};

// Obtener alumnos por estatus y ID de asesor interno
const getStudentsByStatusAndAssessorID = async (req, res) => {
  try {
    const { status, internalAssessorID } = req.query;
    const requesterID = req.user.id;

    // Obtener los roles del usuario autenticado
    const [rolesRows] = await pool.query(`
      SELECT r.roleName
      FROM UserRole ur
      JOIN Role r ON ur.roleID = r.roleID
      WHERE ur.userID = ?
    `, [requesterID]);

    const roles = rolesRows.map(r => r.roleName);
    const isAdmin = roles.includes('Admin') || roles.includes('SuperAdmin');

    // Si no es admin, validar que el asesor esté pidiendo solo su información
    if (!isAdmin && parseInt(internalAssessorID) !== requesterID) {
      return res.status(403).json({
        message: 'No tienes permiso para ver los alumnos de otro asesor.'
      });
    }

    const students = await Student.getStudentsByStatusAndAssessorID(status, internalAssessorID);
    res.status(200).json(students);

  } catch (error) {
    console.error('Error al obtener los alumnos:', error.message);
    res.status(500).json({ message: 'Error al obtener los alumnos' });
  }
};

// Obtener todos los alumnos por estatus del estudiante
const getStudentsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(400).json({ message: "El parámetro 'status' es obligatorio" });
    }

    const students = await Student.getStudentsByStatus(status);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error al obtener estudiantes por status:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar parcialmente los datos de un alumno
const patchStudentController = async (req, res) => {
  try {
    const controlNumber = req.params.controlNumber;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
    }

    // Verificar que el alumno exista y esté activo
    const [rows] = await pool.query(
      'SELECT studentID, userID FROM Student WHERE controlNumber = ? AND recordStatus = "Activo"',
      [controlNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado o ya eliminado.' });
    }

    const { studentID, userID } = rows[0];

    const userFields = ['email', 'phone'];
    const userUpdates = {};
    const studentUpdates = {};

    for (const key in updateData) {
      if (userFields.includes(key)) {
        userUpdates[key] = updateData[key];
      } else if (!['status', 'recordStatus', 'userID'].includes(key)) {
        studentUpdates[key] = updateData[key];
      }
    }

    let studentResult = null;
    if (Object.keys(studentUpdates).length > 0) {
      studentResult = await Student.patchStudent(controlNumber, studentUpdates);
    }

    let userResult = null;
    if (Object.keys(userUpdates).length > 0) {
      const fields = Object.keys(userUpdates).map(f => `${f} = ?`).join(', ');
      const values = Object.values(userUpdates);
      values.push(userID);
      await pool.query(`UPDATE User SET ${fields} WHERE userID = ?`, values);
      userResult = { message: 'Datos de usuario actualizados' };
    }

    return res.status(200).json({
      message: 'Alumno actualizado correctamente',
      studentResult,
      userResult
    });
  } catch (error) {
    console.error("Error al actualizar parcialmente el alumno:", error.message);
    res.status(500).json({ message: "Error al actualizar el alumno", error: error.message });
  }
};

const deleteStudentByControlNumber = async (req, res) => {
    try {
        const controlNumber = req.params.controlNumber;
        const result = await Student.deleteStudentByControlNumber(controlNumber);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar el alumno:', error.message);
        res.status(500).json({ message: 'Error al eliminar el alumno' });
    }
};

// Reasignar asesor interno a un alumno
const reassignAssessorController = async (req, res) => {
  try {
    const { controlNumber } = req.params;
    const { internalAssessorID } = req.body;

    if (!internalAssessorID) {
      return res.status(400).json({ message: 'Debes proporcionar un ID de asesor interno' });
    }

    const reassignmentResult = await Student.reassignAssessor(controlNumber, internalAssessorID);
    res.status(200).json(reassignmentResult);

  } catch (error) {
    console.error('Error al reasignar asesor:', error.message);
    res.status(500).json({ message: 'Error al reasignar asesor interno', error: error.message });
  }
};

// Actualizar el estado de un alumno
const updateStatus = async (req, res) => {
  const { controlNumber } = req.params;
  const { status } = req.body;
  const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido. Usa: Aceptado, Rechazado o Pendiente.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE Student SET status = ? WHERE controlNumber = ? AND recordStatus = "Activo"',
      [status, controlNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alumno no encontrado o eliminado.' });
    }

    return res.status(200).json({ message: `Status del alumno actualizado a "${status}" correctamente.` });
  } catch (error) {
    console.error('Error al actualizar status del alumno:', error.message);
    return res.status(500).json({ message: 'Error interno al actualizar status.', error: error.message });
  }
};

// Exportar todas las funciones
module.exports = {
    registerStudentController,
    getStudentsByLoggedAssessor,
    getStudentByControlNumber,
    getStudentsByInternalAssessorID,
    getAllStudents,
    getStudentsByStatusAndAssessorID,
    getStudentsByStatus,
    countStudents,
    patchStudentController,
    deleteStudentByControlNumber,
    reassignAssessorController,
    updateStatus
};
