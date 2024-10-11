const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');
const cors = require('cors');  // Importar CORS

// Importación de rutas
const userRoutes = require('./routes/UserRoutes');
const studentRoutes = require('./routes/StudentRoutes');  
const internalAssessorRoutes = require('./routes/InternalAssessorRoutes');  
const externalAssessorRoutes = require('./routes/ExternalAssessorRoutes');  
const companyRoutes = require('./routes/CompanyRoutes');  
const studentApplicationRoutes = require('./routes/StudentApplicationRoutes');  
const practicePositionRoutes = require('./routes/PracticePositionRoutes');  
const studentDocumentationRoutes = require('./routes/StudentDocumentationRoutes');  

const app = express();

const corsOptions = {
  origin: 'https://gestor-dasc-frontend.vercel.app/', // Cambia esto a la URL de tu frontend en producción
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Habilitar el envío de cookies y credenciales en las solicitudes
};

// Usar CORS como middleware global con las opciones configuradas
app.use(cors(corsOptions));

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// Ruta raíz simple para verificar que el servidor está en funcionamiento
app.get('/', (req, res) => {
  res.json({ message: 'API running successfully' });
});

// Uso de rutas actualizadas
app.use('/user', userRoutes);
app.use('/students', studentRoutes);  // Rutas para alumnos
app.use('/internalAssessors', internalAssessorRoutes);  // Rutas para asesores internos
app.use('/externalAssessors', externalAssessorRoutes);  // Rutas para asesores externos
app.use('/companies', companyRoutes);  // Rutas para entidades receptoras
app.use('/applications', studentApplicationRoutes);  // Rutas para postulaciones
app.use('/practicePositions', practicePositionRoutes);  // Rutas para vacantes
app.use('/studentDocumentation', studentDocumentationRoutes);  // Rutas para documentos de alumnos

// Manejo de errores
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
