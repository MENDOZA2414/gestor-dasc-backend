const pool = require('../config/db');
const { registrarUsuario } = require('./users');

// Registrar un alumno
const registrarAlumno = async (alumnoData) => {
    const connection = await pool.getConnection();  // Obtener la conexión
    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        const { correo, contraseña, numCelular, nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, carrera, semestre, turno, numControl } = alumnoData;

        // Registrar el usuario primero en la tabla 'usuarios' usando la conexión
        const usuarioID = await registrarUsuario(connection, correo, contraseña, numCelular, 3); // 3 sería el rolID para alumno

        // Insertar en la tabla 'alumno'
        const query = `
            INSERT INTO alumno (numControl, usuarioID, nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, carrera, semestre, turno)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(query, [numControl, usuarioID, nombre, apellidoPaterno, apellidoMaterno, fechaNacimiento, carrera, semestre, turno]);

        // Si todo está bien, confirmar la transacción
        await connection.commit();
        return { message: 'Alumno registrado exitosamente' };

    } catch (error) {
        // Si hay un error, revertir la transacción
        await connection.rollback();
        throw error;
    } finally {
        connection.release();  // Liberar la conexión
    }
};


// Obtener un alumno por su numControl
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


// Obtener imagen de perfil por numControl
const obtenerImagenPerfilPorNumControl = async (numControl) => {
    const query = 'SELECT fotoPerfil FROM alumno WHERE numControl = ?';
    const [resultados] = await pool.query(query, [numControl]);
    if (resultados.length === 0 || !resultados[0].fotoPerfil) {
        throw new Error('Imagen no encontrada');
    }
    return resultados[0].fotoPerfil;
};


// Obtener alumnos asignados a un asesor interno
const obtenerAlumnosPorAsesorID = async (asesorID) => {
    const query = 'SELECT numControl, nombre, turno, carrera, fotoPerfil FROM alumno WHERE asesorInternoID = ?';
    const [resultados] = await pool.query(query, [asesorID]);
    return resultados;
};

// Obtener todos los alumnos asignados a un asesor interno
const obtenerTodosLosAlumnos = async (asesorInternoID) => {
    const query = 'SELECT numControl, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombre, fotoPerfil FROM alumno WHERE asesorInternoID = ? ORDER BY nombre';
    const [resultados] = await pool.query(query, [asesorInternoID]);
    return resultados.map(alumno => ({
        ...alumno,
        fotoPerfil: alumno.fotoPerfil ? `data:image/jpeg;base64,${Buffer.from(alumno.fotoPerfil).toString('base64')}` : null
    }));
};


// Obtener alumnos por estatus y asesor interno ID
const obtenerAlumnosPorEstatusYAsesorID = async (estatus, asesorInternoID) => {
    let query = 'SELECT alumnoID, estatus, CONCAT(nombre, " ", apellidoPaterno, " ", apellidoMaterno) AS nombre, fotoPerfil FROM alumno WHERE 1=1';
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

// Eliminar un alumno por su numControl
const eliminarPorNumControl = async (numControl) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const verificarEstatusQuery = 'SELECT estatus FROM alumno WHERE numControl = ?';
        const eliminarDocumentosSubidosQuery = 'DELETE FROM documentosAlumnoSubido WHERE numControl = ?';
        const eliminarDocumentosQuery = 'DELETE FROM documentosAlumno WHERE numControl = ?';
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
    registrarAlumno,
    obtenerAlumnoPorNumControl, 
    obtenerImagenPerfilPorNumControl,
    obtenerAlumnosPorAsesorID,
    obtenerTodosLosAlumnos,
    obtenerAlumnosPorEstatusYAsesorID,
    eliminarPorNumControl
};


