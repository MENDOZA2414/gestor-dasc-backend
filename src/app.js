const express = require('express');
const config = require('./config');

const app = express();

// Configuraciones
app.set('port', config.app.port)

// Rutas
app.set('api/Clientes', clientes)

module.exports = app;