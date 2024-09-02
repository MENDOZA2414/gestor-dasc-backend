const pool = require('../config/db');

const obtenerEntidadReceptoraPorID = async (entidadID) => {
    const query = 'SELECT * FROM entidadReceptora WHERE entidadID = ?';
    const [resultados] = await pool.query(query, [entidadID]);
    if (resultados.length > 0) {
        const entidad = resultados[0];
        if (entidad.fotoPerfil) {
            entidad.fotoPerfil = entidad.fotoPerfil.toString('base64');
        }
        return entidad;
    } else {
        throw new Error('No existe la entidad receptora');
    }
};

const obtenerTodasLasEntidades = async () => {
    const query = `
        SELECT entidadID, nombreEntidad AS nombre, fotoPerfil AS logoEmpresa 
        FROM entidadReceptora
        ORDER BY nombreEntidad`;

    const [resultados] = await pool.query(query);

    resultados.forEach(row => {
        if (row.logoEmpresa) {
            row.logoEmpresa = `data:image/jpeg;base64,${Buffer.from(row.logoEmpresa).toString('base64')}`;
        }
    });

    return resultados;
};

const obtenerEntidadesPorEstatus = async (estatus) => {
    let query = 'SELECT entidadID, estatus, nombreEntidad AS nombre, fotoPerfil AS logoEmpresa FROM entidadReceptora WHERE 1=1';
    const params = [];

    if (estatus) {
        query += ' AND estatus = ?';
        params.push(estatus);
    } else {
        query += ' AND (estatus IS NULL OR estatus = "")';
    }

    query += ' ORDER BY nombreEntidad';

    const [resultados] = await pool.query(query, params);
    return resultados;
};

const iniciarSesionEntidad = async (email, password) => {
    const query = `SELECT * FROM entidadReceptora WHERE correo = ? AND contraseña = md5(?)`;
    const [resultados] = await pool.query(query, [email, password]);
    if (resultados.length > 0) {
        const entidad = resultados[0];
        if (entidad.fotoPerfil) {
            entidad.fotoPerfil = entidad.fotoPerfil.toString('base64');
        }
        return entidad;
    } else {
        throw new Error('Correo o contraseña incorrectos');
    }
};

const eliminarEntidadReceptora = async (entidadID) => {
    const checkStatusQuery = 'SELECT estatus FROM entidadReceptora WHERE entidadID = ?';
    const deleteQuery = 'DELETE FROM entidadReceptora WHERE entidadID = ?';

    const [resultado] = await pool.query(checkStatusQuery, [entidadID]);

    if (resultado.length > 0 && resultado[0].estatus === 'Aceptado') {
        await pool.query(deleteQuery, [entidadID]);
        return { message: 'Entidad eliminada con éxito' };
    } else {
        throw new Error('Solo se pueden eliminar elementos aceptados');
    }
};

module.exports = {
    obtenerEntidadReceptoraPorID,
    obtenerTodasLasEntidades,
    obtenerEntidadesPorEstatus,
    iniciarSesionEntidad,
    eliminarEntidadReceptora
};
