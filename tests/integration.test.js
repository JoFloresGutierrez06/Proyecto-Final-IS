const request = require('supertest');
const { app, crearAdminYToken, crearUsuarioYToken } = require('./helpers');

describe('Integración completa de roles y flujos', () => {
  test('flujo completo: registro → login → crear donante como admin → consultar como usuario', async () => {
    const adminToken = await crearAdminYToken();

    const registro = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Carlos', correo: `carlos${Date.now()}@test.com`, contrasena: 'secret123' });
    expect(registro.status).toBe(201);
    expect(registro.body.usuario.rol).toBe('usuario');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: registro.body.usuario.correo, contrasena: 'secret123' });
    expect(login.status).toBe(200);
    const usuarioToken = login.body.token;

    const creado = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Panadería Central', tipo: 'empresa' });
    expect(creado.status).toBe(201);

    const lista = await request(app)
      .get('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(lista.status).toBe(200);
    expect(lista.body.donantes.some((d) => d.nombre === 'Panadería Central')).toBe(true);
  });

  test('un token de usuario no sirve para crear (403) pero sí para leer (200)', async () => {
    const usuarioToken = await crearUsuarioYToken();

    const crear = await request(app)
      .post('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`)
      .send({ nombre: 'No', tipo: 'empresa' });
    expect(crear.status).toBe(403);

    const leer = await request(app)
      .get('/api/donantes')
      .set('Authorization', `Bearer ${usuarioToken}`);
    expect(leer.status).toBe(200);
  });
});
