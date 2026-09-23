const { obtenerConexion } = require('../db/connection');

function listar() {
  const db = obtenerConexion();
  const filas = db.prepare('SELECT * FROM donantes ORDER BY id DESC').all();
  return filas.map(mapear);
}

function encontrarPorId(id) {
  const db = obtenerConexion();
  const fila = db.prepare('SELECT * FROM donantes WHERE id = ?').get(id);
  return fila ? mapear(fila) : null;
}

function crear({ nombre, tipo, contacto_email, contacto_telefono }) {
  const db = obtenerConexion();
  const resultado = db
    .prepare(
      'INSERT INTO donantes (nombre, tipo, contacto_email, contacto_telefono) VALUES (?, ?, ?, ?)'
    )
    .run(nombre, tipo, contacto_email || null, contacto_telefono || null);
  return encontrarPorId(Number(resultado.lastInsertRowid));
}

function contar() {
  const db = obtenerConexion();
  const fila = db.prepare('SELECT COUNT(*) AS total FROM donantes').get();
  return Number(fila.total);
}

function mapear(fila) {
  return {
    id: Number(fila.id),
    nombre: fila.nombre,
    tipo: fila.tipo,
    contacto_email: fila.contacto_email,
    contacto_telefono: fila.contacto_telefono,
    fecha_registro: fila.fecha_registro,
  };
}

module.exports = { listar, encontrarPorId, crear, contar };
