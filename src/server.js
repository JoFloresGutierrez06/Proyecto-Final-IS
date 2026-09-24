require('dotenv').config();

const { crearAplicacion } = require('./bootstrap');
const { conectar } = require('./db/connection');
const { asegurarAdmin, variablesDeAdminDefinidas } = require('./services/seedService');
const env = require('./config/env');

async function iniciar() {
  conectar();

  // Crea (o sincroniza) el administrador definido en ADMIN_EMAIL/ADMIN_PASSWORD.
  // Así funciona en entornos sin shell, como Render free tier.
  if (variablesDeAdminDefinidas()) {
    try {
      const resultado = await asegurarAdmin();
      console.log(`Administrador (${resultado.accion}): ${resultado.correo}`);
    } catch (err) {
      console.warn(`Aviso: no se pudo asegurar el administrador: ${err.message}`);
    }
  } else {
    console.log(
      'AVISO: ADMIN_EMAIL/ADMIN_PASSWORD no definidos; ejecuta `npm run seed` para crear el administrador.'
    );
  }

  const app = crearAplicacion();

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });
}

iniciar();
