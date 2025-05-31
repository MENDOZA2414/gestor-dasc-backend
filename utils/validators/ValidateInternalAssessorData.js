const validateInternalAssessorData = (data) => {
  const {
    firstName,
    firstLastName,
    secondLastName, // opcional
    phone,
    status
  } = data;

  // Validar campos obligatorios
  const requiredFields = {
    firstName,
    firstLastName,
    phone,
    status
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value || value.toString().trim() === '') {
      throw new Error(`Campo requerido: ${key}`);
    }
  }

  // Validar formato del teléfono (10 dígitos)
  if (!/^\d{10}$/.test(phone)) {
    throw new Error('El teléfono debe contener exactamente 10 dígitos numéricos');
  }

  // Validar valores permitidos para el estatus
  const validStatuses = ['Activo', 'Inactivo', 'Pendiente'];
  if (!validStatuses.includes(status)) {
    throw new Error('Estatus no válido: debe ser Activo, Inactivo o Pendiente');
  }
};

module.exports = validateInternalAssessorData;
