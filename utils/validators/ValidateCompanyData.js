const validateCompanyData = (data) => {
  const {
    rfc,
    fiscalName,
    companyName,
    address,
    externalNumber,
    city,
    state,
    zipCode,
    companyPhone,
    category,
    areaID
  } = data;

  // Validar campos obligatorios
  const requiredFields = {
    rfc,
    fiscalName,
    companyName,
    address,
    externalNumber,
    city,
    state,
    zipCode,
    companyPhone,
    category
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value || value.toString().trim() === '') {
      throw new Error(`Campo requerido: ${key}`);
    }
  }

  // Validar areaID como número
  if (areaID === undefined || areaID === null || isNaN(areaID)) {
    throw new Error('El área debe ser un número válido');
  }

  // Validar formato del RFC (simplificado)
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
    throw new Error('El RFC no tiene un formato válido');
  }

  // Validar formato del teléfono (10 dígitos)
  if (!/^\d{10}$/.test(companyPhone)) {
    throw new Error('El teléfono de la empresa debe tener exactamente 10 dígitos');
  }

  // Validar formato del código postal (5 dígitos)
  if (!/^\d{5}$/.test(zipCode)) {
    throw new Error('El código postal debe contener exactamente 5 dígitos');
  }

  // Validar categoría
  const validCategories = ['Pública', 'Privada', 'Social'];
  if (!validCategories.includes(category)) {
    throw new Error('Categoría no válida: debe ser Pública, Privada o Social');
  }
};

module.exports = validateCompanyData;