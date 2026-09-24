const express = require('express');
const path = require('path');
const userRepository = require('./repositories/userRepository');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/salud', (req, res) => {
    let admin = 'desconocido';
    try {
      admin = userRepository.existeAdministrador() ? 'presente' : 'ausente';
    } catch (err) {
      console.warn(`No se pudo verificar el administrador: ${err.message}`);
    }
    res.json({
      estado: 'ok',
      mensaje: 'API de gestión de donaciones funcionando',
      admin,
    });
  });

  return app;
}

module.exports = createApp;
