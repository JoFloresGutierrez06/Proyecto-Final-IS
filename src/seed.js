const { conectar, cerrarConexion } = require('./db/connection');
const userRepository = require('./repositories/userRepository');
const authService = require('./services/authService');
const env = require('./config/env');

async function seed() {
  conectar();

  const existe = userRepository.encontrarPorCorreo(env.admin.email);
  if (existe) {
    console.log(`El administrador ya existe: ${env.admin.email}`);
    cerrarConexion();
    return;
  }

  const errores = authService.validarRegistro({
    nombre: env.admin.name,
    correo: env.admin.email,
    contrasena: env.admin.password,
  });
  if (errores.length > 0) {
    console.error('Credenciales de administrador inválidas en las variables de entorno:');
    errores.forEach((e) => console.error(` - ${e}`));
    cerrarConexion();
    process.exit(1);
  }

  const hash = await require('bcryptjs').hash(env.admin.password, 10);
  userRepository.crear({
    nombre: env.admin.name,
    correo: env.admin.email.toLowerCase(),
    contrasena: hash,
    rol: 'administrador',
  });

  console.log(`Administrador creado: ${env.admin.email}`);
  cerrarConexion();
}

seed().catch((err) => {
  console.error('Error al ejecutar el seed:', err.message);
  process.exit(1);
});
