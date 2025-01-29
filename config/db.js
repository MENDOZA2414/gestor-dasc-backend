// Configuración del pool de conexiones a la base de datos MySQL

const mysql2 = require('mysql2/promise');
require('dotenv').config();

// Validación de las variables de entorno requeridas
if (
    !process.env.MYSQLHOST ||
    !process.env.MYSQLUSER ||
    !process.env.MYSQLPASSWORD ||
    !process.env.MYSQLDATABASE ||
    !process.env.MYSQLPORT
) {
    throw new Error('Faltan variables de entorno en el archivo .env');
}

// Configuración del pool de conexiones
const connection = mysql2.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10, // Límite máximo de conexiones
    queueLimit: 0,       // Sin límite de solicitudes en espera
    connectTimeout: 10000 // Tiempo de espera antes de error (ms)
});

// Diagnóstico inicial para verificar la conexión
connection.getConnection()
    .then(() => console.log('Conexión a la base de datos exitosa.'))
    .catch((err) => {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1); // Finaliza la aplicación en caso de error crítico
    });

module.exports = connection;
