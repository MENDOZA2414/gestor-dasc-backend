const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const createError = require('http-errors');

// Importación de rutas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const alumnoRoutes = require('./routes/alumnoRoutes');
const asesorInternoRoutes = require('./routes/asesorInternoRoutes');
const asesorExternoRoutes = require('./routes/asesorExternoRoutes');
const entidadReceptoraRoutes = require('./routes/entidadReceptoraRoutes');
const practicasProfesionalesRoutes = require('./routes/practicasProfesionalesRoutes');
const postulacionAlumnoRoutes = require('./routes/postulacionAlumnoRoutes');
const vacantePracticaRoutes = require('./routes/vacantePracticaRoutes');

const app = express();

// Configuración de la vista
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Uso de rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/alumnos', alumnoRoutes);
app.use('/asesoresInternos', asesorInternoRoutes);
app.use('/asesorExterno', asesorExternoRoutes);
app.use('/entidadReceptora', entidadReceptoraRoutes);
app.use('/practicasProfesionales', practicasProfesionalesRoutes);
app.use('/postulaciones', postulacionAlumnoRoutes);
app.use('/vacantesPractica', vacantePracticaRoutes);

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
