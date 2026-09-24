const bcrypt = require('bcryptjs');
const env = require('./config/env');
const userRepository = require('./repositories/userRepository');
const { conectar, cerrarConexion } = require('./db/connection');
const { asegurarAdmin, variablesDeAdminDefinidas } = require('./services/seedService');

async function seed() {
  conectar();

  try {
    const resultado = await asegurarAdmin();
    if (resultado.accion === 'creado') {
      console.log(`Administrador creado: ${resultado.correo}`);
    } else if (resultado.accion === 'actualizado') {
      console.log(`Administrador actualizado (rol/contraseña sincronizados): ${resultado.correo}`);
    } else {
      console.log(`El administrador ya existe y coincide: ${resultado.correo}`);
    }
    if (!variablesDeAdminDefinidas()) {
      console.log(
        'Nota: ADMIN_EMAIL/ADMIN_PASSWORD no están en el entorno; se usaron los valores por defecto de config/env.js.'
      );
    }
  } finally {
    cerrarConexion();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Error al ejecutar el seed:', err.message);
    process.exit(1);
  });
}

module.exports = { seed };
