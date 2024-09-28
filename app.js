const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');

// Importación de rutas actualizadas
const userRoutes = require('./routes/userRoutes');
const indexRouter = require('./routes/index');
const studentRoutes = require('./routes/studentRoutes');  
const internalAssessorRoutes = require('./routes/internalAssessorRoutes');  
const externalAssessorRoutes = require('./routes/externalAssessorRoutes');  
const companyRoutes = require('./routes/companyRoutes');  
const studentApplicationRoutes = require('./routes/studentApplicationRoutes');  
const practicePositionRoutes = require('./routes/practicePositionRoutes');  
const studentDocumentationRoutes = require('./routes/studentDocumentationRoutes');  

const app = express();

// Configuración de la vista
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para usuarios
app.use('/user', userRoutes);

// Uso de rutas actualizadas
app.use('/', indexRouter);
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
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
