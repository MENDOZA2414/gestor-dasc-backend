const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');

// Importación de rutas
const usersRoutes = require('./routes/usersRoutes');
const indexRouter = require('./routes/index');
const alumnoRoutes = require('./routes/alumnoRoutes');
const asesorInternoRoutes = require('./routes/asesorInternoRoutes');
const asesorExternoRoutes = require('./routes/asesorExternoRoutes');
const entidadReceptoraRoutes = require('./routes/entidadReceptoraRoutes');
const practicasProfesionalesRoutes = require('./routes/practicasProfesionalesRoutes');
const postulacionAlumnoRoutes = require('./routes/postulacionAlumnoRoutes');
const vacantePracticaRoutes = require('./routes/vacantePracticaRoutes');
const documentoAlumnoRoutes = require('./routes/documentoAlumnoRoutes');

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
app.use('/usuarios', usersRoutes);

// Uso de rutas
app.use('/', indexRouter);
app.use('/alumnos', alumnoRoutes);
app.use('/asesorInterno', asesorInternoRoutes);
app.use('/asesorExterno', asesorExternoRoutes);
app.use('/entidadReceptora', entidadReceptoraRoutes);
app.use('/practicasProfesionales', practicasProfesionalesRoutes);
app.use('/postulaciones', postulacionAlumnoRoutes);
app.use('/vacantesPractica', vacantePracticaRoutes);
app.use('/documentoAlumno', documentoAlumnoRoutes);

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
