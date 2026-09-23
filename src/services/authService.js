const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');

const ROLES_VALIDOS = ['administrador', 'usuario'];

function validarRegistro({ nombre, correo, contrasena, rol }) {
  const errores = [];
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    errores.push('El nombre es obligatorio');
  }
  if (!correo || typeof correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.push('El correo no tiene un formato válido');
  }
  if (!contrasena || typeof contrasena !== 'string' || contrasena.length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres');
  }
  if (rol !== undefined && !ROLES_VALIDOS.includes(rol)) {
    errores.push(`El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
  }
  return errores;
}

async function registrarUsuario({ nombre, correo, contrasena, rol }) {
  const errores = validarRegistro({ nombre, correo, contrasena, rol });
  if (errores.length > 0) {
    const error = new Error(errores.join(', '));
    error.statusCode = 400;
    throw error;
  }

  const existente = userRepository.encontrarPorCorreo(correo);
  if (existente) {
    const error = new Error('El correo ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const usuario = userRepository.crear({
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    contrasena: hash,
    rol: rol || 'usuario',
  });

  return userRepository.aPublico(usuario);
}

async function iniciarSesion({ correo, contrasena }) {
  if (!correo || !contrasena) {
    const error = new Error('Correo y contraseña son obligatorios');
    error.statusCode = 400;
    throw error;
  }

  const usuario = userRepository.encontrarPorCorreo(correo.trim().toLowerCase());
  if (!usuario) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!coincide) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const token = generarToken(usuario);
  return { token, usuario: userRepository.aPublico(usuario) };
}

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function obtenerPerfil(usuarioId) {
  const usuario = userRepository.encontrarPorId(usuarioId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }
  return userRepository.aPublico(usuario);
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  generarToken,
  verificarToken,
  obtenerPerfil,
  validarRegistro,
  ROLES_VALIDOS,
};
