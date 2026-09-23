function ejecutarMigraciones(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      contrasena TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('administrador', 'usuario')),
      fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS donantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('empresa', 'organizacion')),
      contacto_email TEXT,
      contacto_telefono TEXT,
      fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { ejecutarMigraciones };
