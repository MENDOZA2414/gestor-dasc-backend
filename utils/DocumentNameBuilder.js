function buildDocumentName(tipo, status, originalName) {
    const safe = originalName
      .replace(/\s+/g, "_")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.-]/g, "");
  
    return `${tipo}_${status}_${safe}`;
  }
  
  module.exports = buildDocumentName;
  