const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestor de Prácticas DASC',
      version: '1.0.0',
      description: 'Documentación de la API del Gestor de Prácticas Profesionales',
    },
    servers: [
      {
        url: 'http://localhost:3000', // cámbialo si usas otro puerto
      },
    ],
  },
  apis: ['./routes/*.js'], // Aquí se indican los archivos donde Swagger leerá los comentarios
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
