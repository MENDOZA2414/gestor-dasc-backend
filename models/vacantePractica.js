const pool = require('../config/db');

const obtenerVacantePorID = async (vacantePracticaID) => {
    const query = 'SELECT * FROM vacantePractica WHERE vacantePracticaID = ?';
    const [result] = await pool.query(query, [vacantePracticaID]);
    if (result.length > 0) {
        let vacante = result[0];
        if (vacante.logoEmpresa) {
            vacante.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(vacante.logoEmpresa).toString('base64')}`;
        }
        return vacante;
    } else {
        throw new Error('No existe la vacante');
    }
};

const obtenerVacantesPorEntidadID = async (entidadID) => {
    const query = `
        SELECT vp.*, 
               ae.nombre AS nombreAsesorExterno, 
               ae.apellidoPaterno AS apellidoPaternoAsesorExterno, 
               ae.apellidoMaterno AS apellidoMaternoAsesorExterno, 
               er.nombreEntidad AS nombreEmpresa, 
               er.fotoPerfil AS logoEmpresa 
        FROM vacantePractica vp
        JOIN asesorExterno ae ON vp.asesorExternoID = ae.asesorExternoID
        JOIN entidadReceptora er ON vp.entidadID = er.entidadID
        WHERE vp.entidadID = ? 
        ORDER BY vp.vacantePracticaID DESC
    `;
    const [results] = await pool.query(query, [entidadID]);
    results.forEach(row => {
        if (row.logoEmpresa) {
            row.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(row.logoEmpresa).toString('base64')}`;
        }
    });
    return results;
};

const obtenerTodasLasVacantes = async (page, limit) => {
    const start = (page - 1) * limit;
    const query = `
        SELECT vp.*, 
               ae.nombre AS nombreAsesorExterno, 
               ae.apellidoPaterno AS apellidoPaternoAsesorExterno, 
               ae.apellidoMaterno AS apellidoMaternoAsesorExterno, 
               er.nombreEntidad AS nombreEmpresa, 
               er.fotoPerfil AS logoEmpresa 
        FROM vacantePractica vp
        JOIN asesorExterno ae ON vp.asesorExternoID = ae.asesorExternoID
        JOIN entidadReceptora er ON vp.entidadID = er.entidadID
        ORDER BY vp.vacantePracticaID DESC 
        LIMIT ?, ?
    `;
    const [results] = await pool.query(query, [start, limit]);
    results.forEach(row => {
        if (row.logoEmpresa) {
            row.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(row.logoEmpresa).toString('base64')}`;
        }
    });
    return results;
};

const obtenerVacantesPorEstatus = async (estatus) => {
    let query = `
      SELECT vp.*, 
             ae.nombre AS nombreAsesorExterno, 
             ae.apellidoPaterno AS apellidoPaternoAsesorExterno, 
             ae.apellidoMaterno AS apellidoMaternoAsesorExterno, 
             er.nombreEntidad AS nombreEmpresa, 
             er.fotoPerfil AS logoEmpresa 
      FROM vacantePractica vp
      JOIN asesorExterno ae ON vp.asesorExternoID = ae.asesorExternoID
      JOIN entidadReceptora er ON vp.entidadID = er.entidadID
      WHERE 1=1
    `;
    const params = [];

    if (estatus) {
        query += ' AND vp.estatus = ?';
        params.push(estatus);
    } else {
        query += ' AND (vp.estatus IS NULL OR vp.estatus = "")';
    }

    query += ' ORDER BY vp.vacantePracticaID DESC';

    const [results] = await pool.query(query, params);
    results.forEach(row => {
        if (row.logoEmpresa) {
            row.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(row.logoEmpresa).toString('base64')}`;
        }
    });
    return results;
};

const crearVacante = async (vacanteData) => {
    const { titulo, fechaInicio, fechaFinal, ciudad, tipoTrabajo, descripcion, entidadID, asesorExternoID } = vacanteData;

    const insertQuery = `
        INSERT INTO vacantePractica (titulo, fechaInicio, fechaFinal, ciudad, tipoTrabajo, descripcion, entidadID, asesorExternoID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertQuery, [titulo, fechaInicio, fechaFinal, ciudad, tipoTrabajo, descripcion, entidadID, asesorExternoID]);

    const selectQuery = `SELECT * FROM vacantePractica WHERE vacantePracticaID = ?`;
    const [result2] = await pool.query(selectQuery, [result.insertId]);
    return result2[0];
};

const eliminarVacante = async (vacantePracticaID) => {
    const checkStatusQuery = 'SELECT estatus FROM vacantePractica WHERE vacantePracticaID = ?';
    const deleteQuery = 'DELETE FROM vacantePractica WHERE vacantePracticaID = ?';

    const [result] = await pool.query(checkStatusQuery, [vacantePracticaID]);

    if (result.length > 0 && result[0].estatus === 'Aceptado') {
        await pool.query(deleteQuery, [vacantePracticaID]);
        return { message: 'Vacante eliminada con éxito' };
    } else {
        throw new Error('Solo se pueden eliminar elementos aceptados');
    }
};

const eliminarVacanteYPostulaciones = async (vacanteID) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const deletePostulacionesQuery = 'DELETE FROM postulacionAlumno WHERE vacanteID = ?';
        await connection.query(deletePostulacionesQuery, [vacanteID]);

        const deleteVacanteQuery = 'DELETE FROM vacantePractica WHERE vacantePracticaID = ?';
        await connection.query(deleteVacanteQuery, [vacanteID]);

        await connection.commit();
        return { message: 'Vacante y sus postulaciones eliminadas con éxito' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    obtenerVacantePorID,
    obtenerVacantesPorEntidadID,
    obtenerTodasLasVacantes,
    obtenerVacantesPorEstatus,
    crearVacante,
    eliminarVacante,
    eliminarVacanteYPostulaciones
};
