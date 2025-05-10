const Student = require('../models/Student');
const { registerStudent } = require('../models/Student');

// Controlador para registrar un alumno
const registerStudentController = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FOTO GENERADA:", req.generatedFileName);
    console.log("BUFFER:", req.bufferFile ? "Sí hay foto" : "No hay foto");
    // Arma el objeto studentData desde los datos del formulario (FormData)
    const studentData = {
      ...req.body,
      semester: req.body.semester,
      internalAssessorID: Number(req.body.internalAssessorID),
      // Estos dos campos vienen del middleware ProfileUpload
      profilePhotoName: req.generatedFileName || null,
      profilePhotoBuffer: req.bufferFile || null,
    };

    // Llamar al modelo que hace el registro en la base de datos y (opcionalmente) FTP
    const result = await registerStudent(studentData, req.generatedFileName, req.bufferFile);

    // Si todo sale bien
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al registrar el alumno:', error.message);

    // Lista de errores conocidos para devolver 400
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

    // Cualquier otro error inesperado
    res.status(500).json({ message: 'Error al registrar el alumno', error: error.message });
  }
};

  
// Obtener un alumno por controlNumber
const getStudentByControlNumber = async (req, res) => {
    try {
        const controlNumber = req.params.controlNumber;
        const student = await Student.getStudentByControlNumber(controlNumber);
        if (!student) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error al obtener el alumno:', error.message);
        res.status(500).json({ message: 'Error al obtener el alumno' });
    }
};


// Obtener alumnos por ID de asesor
const getStudentsByInternalAssessorID = async (req, res) => {
    try {
        const internalAssessorID = req.params.internalAssessorID;
        const students = await Student.getStudentsByInternalAssessorID(internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Obtener todos los alumnos por ID de asesor interno
const getAllStudents = async (req, res) => {
    try {
        const internalAssessorID = req.query.internalAssessorID;
        if (!internalAssessorID) {
            return res.status(400).json({ message: "El ID del asesor interno es obligatorio" });
        }

        const students = await Student.getAllStudents(internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener todos los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener el alumno' });
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
        const students = await Student.getStudentsByStatusAndAssessorID(status, internalAssessorID);
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al obtener los alumnos:', error.message);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

// Obtener todos los alumnos por estatus del estudiante
const getStudentsByStudentStatus = async (req, res) => {
    try {
      const { studentStatus } = req.query;
      if (!studentStatus) {
        return res.status(400).json({ message: "El parámetro 'studentStatus' es obligatorio" });
      }
  
      const students = await Student.getStudentsByStudentStatus(studentStatus);
      res.status(200).json(students);
    } catch (error) {
      console.error('Error al obtener estudiantes por studentStatus:', error.message);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
  
// Actualizar datos de un alumno por controlNumber
const updateStudentController = async (req, res) => {
    try {
      const controlNumber = req.params.controlNumber;
      const updateData = req.body;
  
      const result = await Student.updateStudent(controlNumber, updateData);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error al actualizar el alumno:', error.message);
      res.status(500).json({ message: 'Error al actualizar el alumno', error: error.message });
    }
  };
  
// Eliminar un alumno por controlNumber
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

// Exportar todas las funciones
module.exports = {
    registerStudentController,
    getStudentByControlNumber,
    getStudentsByInternalAssessorID,
    getAllStudents,
    getStudentsByStatusAndAssessorID,
    getStudentsByStudentStatus,
    countStudents,
    updateStudentController,
    deleteStudentByControlNumber
};
