const express = require('express');
const createApp = require('./app');
const authRoutes = require('./routes/auth.routes');
const donantesRoutes = require('./routes/donantes.routes');
const { manejarError } = require('./middleware/errorHandler');

function montarRutas(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/donantes', donantesRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
  });

  app.use(manejarError);
  return app;
}

function crearAplicacion() {
  return montarRutas(createApp());
}

module.exports = { crearAplicacion, montarRutas };
