const pool = require('../config/db');

const obtenerAplicacionesPorVacanteID = async (vacanteID) => {
    const query = `
        SELECT P.*, V.titulo AS vacanteTitulo
        FROM postulacionAlumno P
        INNER JOIN vacantePractica V ON P.vacanteID = V.vacantePracticaID
        WHERE P.vacanteID = ?
    `;
    const [resultados] = await pool.query(query, [vacanteID]);
    return resultados.map(postulacion => ({
        ...postulacion,
        cartaPresentacion: postulacion.cartaPresentacion ? Buffer.from(postulacion.cartaPresentacion).toString('base64') : null
    }));
};

const obtenerCartaPresentacionPorID = async (postulacionID) => {
    const query = 'SELECT cartaPresentacion FROM postulacionAlumno WHERE postulacionID = ?';
    const [resultados] = await pool.query(query, [postulacionID]);
    return resultados.length > 0 ? resultados[0].cartaPresentacion : null;
};

const verificarPostulacionAlumno = async (alumnoID, vacanteID) => {
    const query = 'SELECT COUNT(*) as count FROM postulacionAlumno WHERE alumnoID = ? AND vacanteID = ?';
    const [resultados] = await pool.query(query, [alumnoID, vacanteID]);
    return resultados[0].count > 0;
};

const obtenerPostulacionesPorAlumnoID = async (alumnoID) => {
    const query = 'SELECT vacanteID FROM postulacionAlumno WHERE alumnoID = ?';
    const [resultados] = await pool.query(query, [alumnoID]);
    return resultados;
};

const rechazarPostulacion = async (postulacionID) => {
    const query = 'DELETE FROM postulacionAlumno WHERE postulacionID = ?';
    const [resultado] = await pool.query(query, [postulacionID]);
    return resultado.affectedRows > 0;
};

const aceptarPostulacion = async (postulacionID) => {
    const queryPostulacion = `
        SELECT 
            p.alumnoID, p.vacanteID, p.nombreAlumno, p.correoAlumno,
            v.entidadID, v.asesorExternoID, v.titulo AS tituloVacante,
            v.fechaInicio, v.fechaFinal
        FROM 
            postulacionAlumno p
        JOIN 
            vacantePractica v ON p.vacanteID = v.vacantePracticaID
        WHERE 
            p.postulacionID = ?
    `;

    const queryCheckPractica = `SELECT * FROM practicasProfesionales WHERE alumnoID = ?`;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [resultPostulacion] = await connection.query(queryPostulacion, [postulacionID]);

        if (resultPostulacion.length === 0) throw new Error('No se encontró la postulación');

        const postulacion = resultPostulacion[0];
        const [resultPractica] = await connection.query(queryCheckPractica, [postulacion.alumnoID]);

        if (resultPractica.length > 0) {
            const queryDeletePostulaciones = `DELETE FROM postulacionAlumno WHERE alumnoID = ?`;
            await connection.query(queryDeletePostulaciones, [postulacion.alumnoID]);
            await connection.commit();
            throw new Error('El alumno ya tiene una práctica profesional registrada. Todas sus postulaciones han sido eliminadas.');
        }

        const fechaInicio = postulacion.fechaInicio instanceof Date ? postulacion.fechaInicio.toISOString().split('T')[0] : postulacion.fechaInicio;
        const fechaFinal = postulacion.fechaFinal instanceof Date ? postulacion.fechaFinal.toISOString().split('T')[0] : postulacion.fechaFinal;

        const queryInsertPractica = `
            INSERT INTO practicasProfesionales 
            (alumnoID, entidadID, asesorExternoID, fechaInicio, fechaFin, estado, tituloVacante, fechaCreacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const values = [
            postulacion.alumnoID, 
            postulacion.entidadID, 
            postulacion.asesorExternoID, 
            fechaInicio, 
            fechaFinal, 
            'Iniciada',
            postulacion.tituloVacante
        ];

        await connection.query(queryInsertPractica, values);

        const queryDeletePostulaciones = `DELETE FROM postulacionAlumno WHERE alumnoID = ?`;
        await connection.query(queryDeletePostulaciones, [postulacion.alumnoID]);

        const queryDeleteVacante = `DELETE FROM vacantePractica WHERE vacantePracticaID = ?`;
        await connection.query(queryDeleteVacante, [postulacion.vacanteID]);

        await connection.commit();
        return { message: 'Práctica profesional registrada, postulaciones eliminadas y vacante eliminada con éxito' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerAplicacionesPorVacanteID,
    obtenerCartaPresentacionPorID,
    verificarPostulacionAlumno,
    obtenerPostulacionesPorAlumnoID,
    rechazarPostulacion,
    aceptarPostulacion
};
