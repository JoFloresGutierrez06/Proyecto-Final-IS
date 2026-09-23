const request = require('supertest');
const { app, registrarUsuario, login } = require('./helpers');

describe('Autenticación - registro de usuarios', () => {
  test('registra un usuario correctamente y devuelve 201 sin contraseña', async () => {
    const { res, datos } = await registrarUsuario();
    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      nombre: datos.nombre,
      correo: datos.correo,
      rol: 'usuario',
    });
    expect(res.body.usuario).not.toHaveProperty('contrasena');
    expect(res.body.usuario.id).toBeDefined();
    expect(res.body.usuario.fecha_registro).toBeDefined();
  });

  test('rechaza registro sin nombre (400)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ correo: 'x@test.com', contrasena: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/nombre/i);
  });

  test('rechaza registro con correo inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: 'no-es-correo', contrasena: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/correo/i);
  });

  test('rechaza registro con contraseña corta (400)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: 'ana@test.com', contrasena: '123' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/contraseña/i);
  });

  test('rechaza registro con rol inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: 'ana@test.com', contrasena: 'secret123', rol: 'super' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/rol/i);
  });

  test('rechaza correo duplicado (409)', async () => {
    const { datos } = await registrarUsuario();
    const res = await request(app).post('/api/auth/registro').send(datos);
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toMatch(/registrado/i);
  });
});

describe('Autenticación - inicio de sesión', () => {
  test('inicia sesión y devuelve token JWT y usuario', async () => {
    const { datos } = await registrarUsuario();
    const res = await login(datos.correo, datos.contrasena);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.token.split('.')).toHaveLength(3);
    expect(res.body.usuario.correo).toBe(datos.correo);
    expect(res.body.usuario).not.toHaveProperty('contrasena');
  });

  test('rechaza contraseña incorrecta (401)', async () => {
    const { datos } = await registrarUsuario();
    const res = await login(datos.correo, 'otra-clave');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toMatch(/credenciales/i);
  });

  test('rechaza correo inexistente (401)', async () => {
    const res = await login('nadie@test.com', 'secret123');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toMatch(/credenciales/i);
  });

  test('rechaza login sin credenciales (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Autenticación - perfil y JWT', () => {
  test('devuelve el perfil con token válido (200)', async () => {
    const { datos } = await registrarUsuario();
    const { body } = await login(datos.correo, datos.contrasna || datos.contrasena);
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.correo).toBe(datos.correo);
  });

  test('rechaza petición sin token (401)', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toMatch(/token/i);
  });

  test('rechaza token inválido (401)', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'Bearer token.falso.aqui');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toMatch(/inválido|expirado/i);
  });

  test('rechaza esquema de autorización incorrecto (401)', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
  });

  test('devuelve 404 si el usuario del token ya no existe', async () => {
    const jwt = require('jsonwebtoken');
    const env = require('../src/config/env');
    const token = jwt.sign({ sub: 99999, correo: 'borrado@test.com', rol: 'usuario' }, env.jwtSecret);
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Autenticación - generación y verificación de JWT (unidad)', () => {
  const authService = require('../src/services/authService');

  test('genera un token con payload esperado', () => {
    const token = authService.generarToken({ id: 7, correo: 'a@b.com', rol: 'usuario', nombre: 'A' });
    const payload = authService.verificarToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.rol).toBe('usuario');
    expect(payload.correo).toBe('a@b.com');
  });

  test('verificarToken lanza error con token manipulado', () => {
    expect(() => authService.verificarToken('no.es.valido')).toThrow();
  });
});
