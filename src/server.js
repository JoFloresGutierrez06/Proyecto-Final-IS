require('dotenv').config();

const { crearAplicacion } = require('./bootstrap');
const { conectar } = require('./db/connection');
const env = require('./config/env');

conectar();

const app = crearAplicacion();

app.listen(env.port, () => {
  console.log(`Servidor escuchando en http://localhost:${env.port}`);
});
