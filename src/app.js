const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/salud', (req, res) => {
    res.json({
      estado: 'ok',
      mensaje: 'API de gestión de donaciones funcionando',
    });
  });

  return app;
}

module.exports = createApp;
