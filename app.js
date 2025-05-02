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
const fileUploadRoutes = require("./routes/FileUploadRoutes");

const app = express();

const allowedOrigins = [
  'https://gestor-dasc-frontend.vercel.app', // Origen de producción
  'http://localhost:5173' // Origen local para desarrollo
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (por ejemplo, Postman) o que coincidan con los permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  },
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
app.use("/api/files", fileUploadRoutes); // Rutas para carga de archivos

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
