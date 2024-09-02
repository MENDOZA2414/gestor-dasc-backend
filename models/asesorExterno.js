const pool = require('../config/db');

const obtenerAsesorExternoPorID = async (asesorExternoID) => {
    const query = 'SELECT * FROM asesorExterno WHERE asesorExternoID = ?';
    const [resultados] = await pool.query(query, [asesorExternoID]);
    if (resultados.length > 0) {
        const asesor = resultados[0];
        if (asesor.fotoPerfil) {
            asesor.fotoPerfil = asesor.fotoPerfil.toString('base64');
        }
        return asesor;
    } else {
        throw new Error('No existe el asesor externo');
    }
};

const iniciarSesionAsesorExterno = async (email, password) => {
    const query = `SELECT * FROM asesorExterno WHERE correo = ? AND contraseña = md5(?)`;
    const [resultados] = await pool.query(query, [email, password]);
    if (resultados.length > 0) {
        const asesor = resultados[0];
        if (asesor.fotoPerfil) {
            asesor.fotoPerfil = asesor.fotoPerfil.toString('base64');
        }
        return asesor;
    } else {
        throw new Error('Correo o contraseña incorrectos');
    }
};

module.exports = {
    obtenerAsesorExternoPorID,
    iniciarSesionAsesorExterno,
};
