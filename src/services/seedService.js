const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { validarRegistro } = require('./authService');

function variablesDeAdminDefinidas() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(email && email.trim() && password && password.trim());
}

async function asegurarAdmin() {
  // Los valores de entorno pueden traer espacios o saltos de línea ocultos
  // (típico al pegar en el editor de variables de Render); se recortan
  // para que el hash coincida siempre con lo que se escribe en el login.
  const email = (env.admin.email || '').trim();
  const password = (env.admin.password || '').trim();
  const name = (env.admin.name || '').trim() || 'Administrador';

  const errores = validarRegistro({ nombre: name, correo: email, contrasena: password });
  if (errores.length > 0) {
    const error = new Error(`Credenciales de administrador inválidas: ${errores.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const correo = email.toLowerCase();
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
