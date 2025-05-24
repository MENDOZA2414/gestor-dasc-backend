
const validateInternalAssessorData = (data) => {
  const {
    firstName,
    firstLastName,
    secondLastName,
    phone,
    internalAssessorStatus
  } = data;

  const requiredFields = {
    firstName,
    firstLastName,
    phone,
    internalAssessorStatus
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value || value.toString().trim() === "") {
      throw new Error(`Campo requerido: ${key}`);
    }
  }

  // Validar teléfono
  if (!/^\d{10}$/.test(phone)) {
    throw new Error('El teléfono debe tener 10 dígitos');
  }

  // Validar estatus permitido
  const validStatuses = ['Activo', 'Inactivo', 'Pendiente'];
  if (!validStatuses.includes(internalAssessorStatus)) {
    throw new Error('Estatus no válido (Activo, Inactivo o Pendiente)');
  }
};

module.exports = validateInternalAssessorData;
