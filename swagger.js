const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestor de Prácticas DASC – API',
      version: '1.0.0',
      description: 'Documentación oficial de la API del Gestor de Prácticas Profesionales del DASC (UABCS).',
    },
    servers: [
      {
        url: 'https://gestor-dasc-backend.onrender.com',
        description: 'Servidor en producción (Render)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Servidor local (desarrollo)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
