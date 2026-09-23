const request = require('supertest');
const { app, crearAdminYToken, crearUsuarioYToken } = require('./helpers');

describe('Módulo de donantes', () => {
  let adminToken;
  let usuarioToken;

  beforeEach(async () => {
    adminToken = await crearAdminYToken();
    usuarioToken = await crearUsuarioYToken();
  });

  test('el administrador crea un donante (201)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Fundación Ayuda',
        tipo: 'organizacion',
        contacto_email: 'contacto@ayuda.org',
        contacto_telefono: '555-0000',
      });
    expect(res.status).toBe(201);
    expect(res.body.donante).toMatchObject({
      nombre: 'Fundación Ayuda',
      tipo: 'organizacion',
      contacto_email: 'contacto@ayuda.org',
    });
    expect(res.body.donante.id).toBeDefined();
    expect(res.body.donante.fecha_registro).toBeDefined();
  });

  test('el usuario NO puede crear donantes (403)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`)
      .send({ nombre: 'Otro', tipo: 'empresa' });
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toMatch(/permisos/i);
    expect(res.body.rolActual).toBe('usuario');
  });

  test('no se puede crear donante sin token (401)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .send({ nombre: 'Otro', tipo: 'empresa' });
    expect(res.status).toBe(401);
  });

  test('valida nombre obligatorio (400)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: '', tipo: 'empresa' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/nombre/i);
  });

  test('valida tipo de donante (400)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X', tipo: 'otra' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/tipo/i);
  });

  test('valida email de contacto (400)', async () => {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X', tipo: 'empresa', contacto_email: 'malo' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/correo/i);
  });

  test('lista donantes autenticado (200)', async () => {
    await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Empresa Uno', tipo: 'empresa' });

    const res = await request(app)
      .get('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.donantes)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test('lista vacía devuelve total 0 (200)', async () => {
    const res = await request(app)
      .get('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  test('consulta donante por id (200)', async () => {
    const creado = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Org Uno', tipo: 'organizacion' });

    const res = await request(app)
      .get(`/api/donantes/${creado.body.donante.id}`)
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(res.status).toBe(200);
    expect(res.body.donante.nombre).toBe('Org Uno');
  });

  test('devuelve 404 si el donante no existe', async () => {
    const res = await request(app)
      .get('/api/donantes/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toMatch(/no encontrado/i);
  });

  test('devuelve 400 si el id no es numérico', async () => {
    const res = await request(app)
      .get('/api/donantes/abc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/número/i);
  });

  test('no permite consultar sin token (401)', async () => {
    const res = await request(app).get('/api/donantes');
    expect(res.status).toBe(401);
  });
});

describe('Servicio de donantes - validaciones (unidad)', () => {
  const donanteService = require('../src/services/donanteService');

  test('validarDonante devuelve lista vacía con datos válidos', () => {
    const errores = donanteService.validarDonante({
      nombre: 'Empresa',
      tipo: 'empresa',
      contacto_email: 'a@b.com',
    });
    expect(errores).toEqual([]);
  });

  test('validarDonante acepta campos opcionales ausentes', () => {
    const errores = donanteService.validarDonante({ nombre: 'Org', tipo: 'organizacion' });
    expect(errores).toEqual([]);
  });

  test('crearDonante lanza error 400 con datos inválidos', () => {
    try {
      donanteService.crearDonante({ nombre: '', tipo: 'x' });
      throw new Error('No debió llegar aquí');
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });
});
