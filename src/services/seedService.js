const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { validarRegistro } = require('./authService');

function variablesDeAdminDefinidas() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

async function asegurarAdmin() {
  const { email, password, name } = env.admin;

  const errores = validarRegistro({ nombre: name, correo: email, contrasena: password });
  if (errores.length > 0) {
    const error = new Error(`Credenciales de administrador inválidas: ${errores.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const correo = email.trim().toLowerCase();
  const existente = userRepository.encontrarPorCorreo(correo);

  if (!existente) {
    const hash = await bcrypt.hash(password, 10);
    userRepository.crear({ nombre: name, correo, contrasena: hash, rol: 'administrador' });
    return { accion: 'creado', correo };
  }

  const passwordOk = await bcrypt.compare(password, existente.contrasena);
  if (existente.rol === 'administrador' && passwordOk) {
    return { accion: 'sin-cambios', correo };
  }

  const hash = await bcrypt.hash(password, 10);
  userRepository.actualizar(existente.id, { contrasena: hash, rol: 'administrador' });
  return { accion: 'actualizado', correo };
}

module.exports = { asegurarAdmin, variablesDeAdminDefinidas };
