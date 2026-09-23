const donanteRepository = require('../repositories/donanteRepository');

const TIPOS_VALIDOS = ['empresa', 'organizacion'];

function validarDonante({ nombre, tipo, contacto_email, contacto_telefono }) {
  const errores = [];

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    errores.push('El nombre es obligatorio');
  }

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    errores.push(`El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
  }

  if (
    contacto_email !== undefined &&
    contacto_email !== null &&
    contacto_email !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto_email)
  ) {
    errores.push('El correo de contacto no tiene un formato válido');
  }

  return errores;
}

function crearDonante(datos) {
  const errores = validarDonante(datos);
  if (errores.length > 0) {
    const error = new Error(errores.join(', '));
    error.statusCode = 400;
    throw error;
  }

  return donanteRepository.crear({
    nombre: datos.nombre.trim(),
    tipo: datos.tipo,
    contacto_email: datos.contacto_email || null,
    contacto_telefono: datos.contacto_telefono || null,
  });
}

function listarDonantes() {
  return donanteRepository.listar();
}

function obtenerDonante(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    const error = new Error('El id debe ser un número entero positivo');
    error.statusCode = 400;
    throw error;
  }

  const donante = donanteRepository.encontrarPorId(numId);
  if (!donante) {
    const error = new Error('Donante no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return donante;
}

module.exports = {
  crearDonante,
  listarDonantes,
  obtenerDonante,
  validarDonante,
  TIPOS_VALIDOS,
};
