const pool = require('../config/db');

const obtenerAlumnoPorNumControl = async (numControl) => {
    const query = 'SELECT * FROM alumno WHERE numControl = ?';
    const [resultados] = await pool.query(query, [numControl]);
    if (resultados.length > 0) {
        const alumno = resultados[0];
        if (alumno.fotoPerfil) {
            alumno.fotoPerfil = alumno.fotoPerfil.toString('base64');
        }
        return alumno;
    } else {
        throw new Error('No existe el alumno');
    }
};

const obtenerImagenPerfilPorNumControl = async (numControl) => {
    const query = 'SELECT fotoPerfil FROM alumno WHERE numControl = ?';
    const [resultados] = await pool.query(query, [numControl]);
    if (resultados.length === 0 || !resultados[0].fotoPerfil) {
        throw new Error('Imagen no encontrada');
    }
    return resultados[0].fotoPerfil;
};

const obtenerAlumnosPorAsesorID = async (asesorID) => {
    const query = 'SELECT numControl, nombre, turno, carrera, fotoPerfil FROM alumno WHERE asesorInternoID = ?';
    const [resultados] = await pool.query(query, [asesorID]);
    return resultados;
};

const obtenerTodosLosAlumnos = async (asesorInternoID) => {
    const query = 'SELECT numControl, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombre, fotoPerfil FROM alumno WHERE asesorInternoID = ? ORDER BY nombre';
    const [resultados] = await pool.query(query, [asesorInternoID]);
    return resultados.map(alumno => ({
        ...alumno,
        fotoPerfil: alumno.fotoPerfil ? `data:image/jpeg;base64,${Buffer.from(alumno.fotoPerfil).toString('base64')}` : null
    }));
};

const obtenerAlumnosPorEstatusYAsesorID = async (estatus, asesorInternoID) => {
    let query = 'SELECT numControl, estatus, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombre, fotoPerfil FROM alumno WHERE 1=1';
    const params = [];

    if (estatus) {
        query += ' AND estatus = ?';
        params.push(estatus);
    } else {
        query += ' AND (estatus IS NULL OR estatus = "")';
    }

    if (asesorInternoID) {
        query += ' AND asesorInternoID = ?';
        params.push(asesorInternoID);
    }

    query += ' ORDER BY nombre';

    const [resultados] = await pool.query(query, params);
    return resultados.map(alumno => ({
        ...alumno,
        fotoPerfil: alumno.fotoPerfil ? `data:image/jpeg;base64,${Buffer.from(alumno.fotoPerfil).toString('base64')}` : null
    }));
};

const eliminarPorNumControl = async (numControl) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const verificarEstatusQuery = 'SELECT estatus FROM alumno WHERE numControl = ?';
        const eliminarDocumentosSubidosQuery = 'DELETE FROM documentosAlumnoSubido WHERE alumnoID = ?';
        const eliminarDocumentosQuery = 'DELETE FROM documentoAlumno WHERE alumnoID = ?';
        const eliminarAlumnoQuery = 'DELETE FROM alumno WHERE numControl = ?';
        
        const [resultado] = await connection.query(verificarEstatusQuery, [numControl]);

        if (resultado.length > 0 && resultado[0].estatus === 'Aceptado') {
            await connection.query(eliminarDocumentosSubidosQuery, [numControl]);
            await connection.query(eliminarDocumentosQuery, [numControl]);
            await connection.query(eliminarAlumnoQuery, [numControl]);
            await connection.commit();
            return { message: 'Alumno y documentos eliminados con éxito' };
        } else {
            await connection.rollback();
            throw new Error('Solo se pueden eliminar elementos aceptados');
        }
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerAlumnoPorNumControl,
    obtenerImagenPerfilPorNumControl,
    obtenerAlumnosPorAsesorID,
    obtenerTodosLosAlumnos,
    obtenerAlumnosPorEstatusYAsesorID,
    eliminarPorNumControl
};
