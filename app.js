const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const documentRoutes = require('./routes/DocumentRoutes');
const professionalPracticeRoutes = require('./routes/ProfessionalPracticeRoutes');
const userRoleRoutes = require('./routes/UserRoleRoutes');
const auditRoutes = require('./routes/AuditRoutes');
const practiceProgressRoutes = require('./routes/PracticeProgressRoutes');

const app = express();

// Configuración de CORS 
const allowedOrigins = [
  'https://gestor-dasc-frontend.vercel.app', // Producción
  'http://localhost:5173' // Desarrollo local
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// CORS middleware
app.use(cors(corsOptions));

// Seguridad general
app.use(helmet());

// Middlewares básicos
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Ruta raíz simple
app.get('/', (req, res) => {
  res.json({ message: 'API running successfully' });
});

// Uso de rutas actualizadas
app.use('/api/users', userRoutes);  // Rutas para usuarios (registro, login, foto, etc.)
app.use('/api/students', studentRoutes);  // Rutas para alumnos
app.use('/api/internalAssessors', internalAssessorRoutes);  // Rutas para asesores internos
app.use('/api/externalAssessors', externalAssessorRoutes);  // Rutas para asesores externos
app.use('/api/companies', companyRoutes);  // Rutas para entidades receptoras
app.use('/api/student-applications', studentApplicationRoutes);  // Rutas para postulaciones
app.use('/api/practicePositions', practicePositionRoutes);  // Rutas para vacantes
app.use('/api/professional-practices', professionalPracticeRoutes);  // Rutas para prácticas profesionales
app.use('/api/student-documentation', studentDocumentationRoutes);  // Rutas para documentos de alumnos
app.use('/api/documents', documentRoutes); // Rutas para carga de archivos
app.use('/api/user-roles', userRoleRoutes); // Rutas para roles de usuarios
app.use('/api/audit', auditRoutes); // Rutas para auditoría de documentos
app.use('/api/practiceProgress', practiceProgressRoutes);  // Rutas para progreso de prácticas profesionales

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
