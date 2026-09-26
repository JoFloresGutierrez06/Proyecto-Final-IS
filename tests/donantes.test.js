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

describe('Módulo de donantes - edición (PUT /:id)', () => {
  let adminToken;
  let usuarioToken;

  beforeEach(async () => {
    adminToken = await crearAdminYToken();
    usuarioToken = await crearUsuarioYToken();
  });

  async function crearDonante(datos = {}) {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Org Base', tipo: 'organizacion', ...datos });
    return res.body.donante;
  }

  test('el administrador edita un donante (200)', async () => {
    const creado = await crearDonante();

    const res = await request(app)
      .put(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Org Editada', tipo: 'empresa', contacto_email: 'nuevo@org.com' });

    expect(res.status).toBe(200);
    expect(res.body.donante).toMatchObject({
      id: creado.id,
      nombre: 'Org Editada',
      tipo: 'empresa',
      contacto_email: 'nuevo@org.com',
    });
    expect(res.body.mensaje).toMatch(/actualizado/i);

    const verificado = await request(app)
      .get(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(verificado.body.donante.nombre).toBe('Org Editada');
  });

  test('la edición parcial conserva los campos no enviados (200)', async () => {
    const creado = await crearDonante({
      nombre: 'Panadería Central',
      contacto_email: 'info@pan.com',
      contacto_telefono: '555-1000',
    });

    const res = await request(app)
      .put(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ contacto_telefono: '555-9999' });

    expect(res.status).toBe(200);
    expect(res.body.donante).toMatchObject({
      nombre: 'Panadería Central',
      tipo: 'organizacion',
      contacto_email: 'info@pan.com',
      contacto_telefono: '555-9999',
    });
  });

  test('el usuario NO puede editar (403)', async () => {
    const creado = await crearDonante();
    const res = await request(app)
      .put(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${usuarioToken}`)
      .send({ nombre: 'Hackeada' });
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toMatch(/permisos/i);
  });

  test('no se puede editar sin token (401)', async () => {
    const res = await request(app).put('/api/donantes/1').send({ nombre: 'X' });
    expect(res.status).toBe(401);
  });

  test('valida datos inválidos en la edición (400)', async () => {
    const creado = await crearDonante();
    const res = await request(app)
      .put(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'inventado' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/tipo/i);
  });

  test('devuelve 400 si el id no es numérico', async () => {
    const res = await request(app)
      .put('/api/donantes/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/número/i);
  });

  test('devuelve 404 si el donante a editar no existe', async () => {
    const res = await request(app)
      .put('/api/donantes/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X' });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toMatch(/no encontrado/i);
  });
});

describe('Módulo de donantes - eliminación (DELETE /:id)', () => {
  let adminToken;
  let usuarioToken;

  beforeEach(async () => {
    adminToken = await crearAdminYToken();
    usuarioToken = await crearUsuarioYToken();
  });

  async function crearDonante(nombre = 'Para Borrar') {
    const res = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre, tipo: 'empresa' });
    return res.body.donante;
  }

  test('el administrador elimina un donante (200) y desaparece de la lista', async () => {
    const creado = await crearDonante();

    const res = await request(app)
      .delete(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado/i);
    expect(res.body.donante.id).toBe(creado.id);

    const verificado = await request(app)
      .get(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(verificado.status).toBe(404);

    const lista = await request(app)
      .get('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(lista.body.donantes.some((d) => d.id === creado.id)).toBe(false);
  });

  test('el usuario NO puede eliminar (403)', async () => {
    const creado = await crearDonante();
    const res = await request(app)
      .delete(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toMatch(/permisos/i);

    const verificado = await request(app)
      .get(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(verificado.status).toBe(200);
  });

  test('no se puede eliminar sin token (401)', async () => {
    const res = await request(app).delete('/api/donantes/1');
    expect(res.status).toBe(401);
  });

  test('devuelve 400 si el id no es numérico', async () => {
    const res = await request(app)
      .delete('/api/donantes/abc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/número/i);
  });

  test('devuelve 404 si el donante a eliminar no existe', async () => {
    const res = await request(app)
      .delete('/api/donantes/99999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toMatch(/no encontrado/i);
  });

  test('rechaza la eliminación doble con 404', async () => {
    const creado = await crearDonante();
    await request(app)
      .delete(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const res = await request(app)
      .delete(`/api/donantes/${creado.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
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
