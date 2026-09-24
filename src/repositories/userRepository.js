const { obtenerConexion } = require('../db/connection');

function encontrarPorCorreo(correo) {
  const db = obtenerConexion();
  const fila = db
    .prepare('SELECT id, nombre, correo, contrasena, rol, fecha_registro FROM users WHERE correo = ?')
    .get(correo);
  return fila ? mapear(fila) : null;
}

function encontrarPorId(id) {
  const db = obtenerConexion();
  const fila = db
    .prepare('SELECT id, nombre, correo, contrasena, rol, fecha_registro FROM users WHERE id = ?')
    .get(id);
  return fila ? mapear(fila) : null;
}

function crear({ nombre, correo, contrasena, rol = 'usuario' }) {
  const db = obtenerConexion();
  const resultado = db
    .prepare('INSERT INTO users (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)')
    .run(nombre, correo, contrasena, rol);
  return encontrarPorId(Number(resultado.lastInsertRowid));
}

function contarUsuarios() {
  const db = obtenerConexion();
  const fila = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  return Number(fila.total);
}

function actualizar(id, campos) {
  const db = obtenerConexion();
  const permitidos = ['nombre', 'correo', 'contrasena', 'rol'];
  const claves = Object.keys(campos).filter((k) => permitidos.includes(k));
  if (claves.length === 0) {
    return encontrarPorId(id);
  }
  const sets = claves.map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(
    ...claves.map((k) => campos[k]),
    id
  );
  return encontrarPorId(id);
}

function mapear(fila) {
  return {
    id: Number(fila.id),
    nombre: fila.nombre,
    correo: fila.correo,
    contrasena: fila.contrasena,
    rol: fila.rol,
    fecha_registro: fila.fecha_registro,
  };
}

function aPublico(usuario) {
  if (!usuario) return null;
  const { contrasena, ...resto } = usuario;
  return resto;
}

module.exports = {
  encontrarPorCorreo,
  encontrarPorId,
  crear,
  actualizar,
  contarUsuarios,
  aPublico,
};
