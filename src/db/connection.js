const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const env = require('../config/env');
const { ejecutarMigraciones } = require('./schema');

let db = null;

function obtenerRutaBaseDatos() {
  return env.databasePath;
}

function conectar(ruta = obtenerRutaBaseDatos()) {
  if (db) return db;

  const esEnMemoria = ruta === ':memory:';
  if (!esEnMemoria) {
    const dir = path.dirname(path.resolve(ruta));
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(ruta);
  ejecutarMigraciones(db);
  return db;
}

function obtenerConexion() {
  if (!db) return conectar();
  return db;
}

function cerrarConexion() {
  if (db) {
    db.close();
    db = null;
  }
}

function reiniciarConexion(ruta) {
  cerrarConexion();
  return conectar(ruta);
}

module.exports = {
  conectar,
  obtenerConexion,
  cerrarConexion,
  reiniciarConexion,
  obtenerRutaBaseDatos,
};
