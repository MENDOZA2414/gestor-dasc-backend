const pool = require('../config/db');

const obtenerAsesorInternoPorID = async (asesorInternoID) => {
    const query = 'SELECT * FROM asesorInterno WHERE asesorInternoID = ?';
    const [resultados] = await pool.query(query, [asesorInternoID]);
    if (resultados.length > 0) {
        const asesor = resultados[0];
        if (asesor.fotoPerfil) {
            asesor.fotoPerfil = asesor.fotoPerfil.toString('base64');
        }
        return asesor;
    } else {
        throw new Error('No existe el asesor interno');
    }
};

const obtenerTodosLosAsesoresInternos = async () => {
    const query = 'SELECT asesorInternoID, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombreCompleto FROM asesorInterno';
    const [resultados] = await pool.query(query);
    return resultados;
};

const iniciarSesionAsesorInterno = async (email, password) => {
    const query = 'SELECT * FROM asesorInterno WHERE correo = ? AND contraseña = md5(?)';
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

const contarAsesoresInternos = async () => {
    const query = 'SELECT COUNT(*) as count FROM asesorInterno';
    const [resultados] = await pool.query(query);
    return resultados[0].count;
};

module.exports = {
    obtenerAsesorInternoPorID,
    obtenerTodosLosAsesoresInternos,
    iniciarSesionAsesorInterno,
    contarAsesoresInternos
};
