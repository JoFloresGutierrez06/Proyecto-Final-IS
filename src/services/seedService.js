const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { validarRegistro } = require('./authService');

// Espacios, saltos de línea y caracteres de control o invisibles
// (zero-width, BOM, marcas bidi, etc.) que suelen colarse al pegar
// valores en el editor de variables de Render.
function limpiarValor(valor) {
  return (valor || '')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function variablesDeAdminDefinidas() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(limpiarValor(email) && limpiarValor(password));
}

async function asegurarAdmin() {
  const email = limpiarValor(env.admin.email);
  const password = limpiarValor(env.admin.password);
  const name = limpiarValor(env.admin.name) || 'Administrador';

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
