const validateCompanyData = (data) => {
  const {
    rfc, fiscalName, companyName, address, externalNumber, city, state,
    zipCode, companyPhone, category, areaID
  } = data;

  // Validar campos obligatorios como strings defensivos
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
    const val = String(value || '').trim();
    if (!val) {
      throw new Error(`Campo requerido: ${key}`);
    }
  }

  // Validar que areaID sea un número válido
  if (areaID === undefined || areaID === null || isNaN(areaID)) {
    throw new Error('El área debe ser un número válido');
  }

  // Validar RFC (simplificado)
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
    throw new Error('RFC no válido');
  }

  // Validar teléfono
  if (!/^\d{10}$/.test(companyPhone)) {
    throw new Error('El teléfono de la empresa debe tener 10 dígitos');
  }

  // Validar código postal
  if (!/^\d{5}$/.test(zipCode)) {
    throw new Error('El código postal debe tener 5 dígitos');
  }

  // Validar categoría aceptada
  const validCategories = ['Pública', 'Privada', 'Social'];
  if (!validCategories.includes(category)) {
    throw new Error('Categoría no válida (Pública, Privada o Social)');
  }
};

module.exports = validateCompanyData;
