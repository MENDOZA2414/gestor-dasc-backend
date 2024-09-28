const pool = require('./config/db'); // Asegúrate de que la ruta sea correcta según tu estructura de proyecto

const probarConsulta = async () => {
    const query = 'SELECT entidadID, nombreEntidad AS nombre, fotoPerfil AS logoEmpresa FROM entidadReceptora ORDER BY nombreEntidad';
    try {
        const [resultados] = await pool.query(query);
        console.log('Resultados obtenidos directamente:', resultados);
    } catch (error) {
        console.error('Error al ejecutar la consulta directa:', error.message);
    }
};

probarConsulta();
