const pool = require('../config/db');

const obtenerUltimaPracticaPorNumControl = async (numControl) => {
    const query = `
        SELECT * FROM practicasProfesionales 
        WHERE alumnoID = ? 
        ORDER BY fechaCreacion DESC 
        LIMIT 1
    `;
    const [resultados] = await pool.query(query, [numControl]);
    if (resultados.length > 0) {
        return resultados[0];
    } else {
        throw new Error('No se encontró una práctica profesional para este alumno');
    }
};

module.exports = {
    // otros métodos...
    obtenerUltimaPracticaPorNumControl
};
