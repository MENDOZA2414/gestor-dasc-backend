const validateStudentData = (data) => {
    const {
        firstName,
        firstLastName,
        dateOfBirth,
        career,
        semester,
        shift,
        studentStatus,
        status,
        controlNumber
    } = data;
      
  
    // Validaciones de campos obligatorios
    const requiredFields = {
      firstName,
      firstLastName,
      dateOfBirth,
      career,
      semester,
      shift,
      studentStatus,
      controlNumber
    };
  
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === "") {
        throw new Error(`Campo requerido: ${key}`);
      }
    }
  
    // Validar valores permitidos
    const validCareers = ['IDS', 'ITC', 'IC', 'LATI', 'LITI'];
    if (!validCareers.includes(career)) {
      throw new Error('Carrera no válida');
    }
  
    const validShifts = ['TM', 'TV'];
    if (!validShifts.includes(shift)) {
      throw new Error('Turno no válido');
    }
  
    const validStatuses = ['Aceptado', 'Rechazado', 'Pendiente'];
    if (!validStatuses.includes(status)) {
    throw new Error('Estatus no válido');
    }

    
    // Validar semestre
    const validSemesters = ['0', '7', '9']; 
    if (!validSemesters.includes(semester.toString())) {
      throw new Error('El semestre debe ser 0 (egresado), 7 (LATI/LITI) o 9 (otras carreras)');
    }
  
    // Validar número de control
    if (!/^\d{10}$/.test(controlNumber)) {
      throw new Error('El número de control debe ser un número de 10 dígitos');
    }    
  };
  
  module.exports = validateStudentData;
  