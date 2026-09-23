const request = require('supertest');
const { crearAplicacion } = require('../src/bootstrap');

const app = crearAplicacion();

async function registrarUsuario(overrides = {}) {
  const datos = {
    nombre: 'Usuario Test',
    correo: `user${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`,
    contrasena: 'secret123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/registro').send(datos);
  return { res, datos };
}

async function login(correo, contrasena) {
  return request(app).post('/api/auth/login').send({ correo, contrasena });
}

async function crearAdminYToken() {
  const correo = `admin${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;
  await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Admin', correo, contrasena: 'secret123' });

  const { obtenerConexion } = require('../src/db/connection');
  const db = obtenerConexion();
  db.prepare("UPDATE users SET rol = 'administrador' WHERE correo = ?").run(correo);

  const res = await login(correo, 'secret123');
  return res.body.token;
}

async function crearUsuarioYToken() {
  const correo = `user${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;
  await request(app)
    .post('/api/auth/registro')
    .send({ nombre: 'Usuario', correo, contrasena: 'secret123' });
  const res = await login(correo, 'secret123');
  return res.body.token;
}

module.exports = { app, registrarUsuario, login, crearAdminYToken, crearUsuarioYToken };
