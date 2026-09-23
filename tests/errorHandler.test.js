const request = require('supertest');
const { app } = require('./helpers');
const { manejarError } = require('../src/middleware/errorHandler');

describe('Manejo de errores y rutas', () => {
  test('GET /api/salud responde 200', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ok');
  });

  test('ruta API inexistente devuelve 404 JSON', async () => {
    const res = await request(app).get('/api/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toMatch(/no encontrada/i);
  });

  test('manejarError responde 500 genérico sin exponer detalles', () => {
    const res = {
      headersSent: false,
      statusCode: null,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(b) {
        this.body = b;
        return this;
      },
    };
    const err = new Error('detalle interno secreto');
    const original = console.error;
    console.error = jest.fn();
    manejarError(err, {}, res, () => {});
    console.error = original;
    expect(res.statusCode).toBe(500);
    expect(res.body.mensaje).toBe('Error interno del servidor');
    expect(res.body.mensaje).not.toMatch(/secreto/);
  });

  test('manejarError respeta statusCode del error', () => {
    const res = {
      headersSent: false,
      statusCode: null,
      body: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(b) {
        this.body = b;
        return this;
      },
    };
    const err = new Error('Mensaje de negocio');
    err.statusCode = 409;
    manejarError(err, {}, res, () => {});
    expect(res.statusCode).toBe(409);
    expect(res.body.mensaje).toBe('Mensaje de negocio');
  });

  test('manejarError delega si las cabeceras ya fueron enviadas', () => {
    const res = { headersSent: true };
    const next = jest.fn();
    const err = new Error('x');
    manejarError(err, {}, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('Servicio de auth - validaciones de registro (unidad)', () => {
  const authService = require('../src/services/authService');

  test('validarRegistro detecta múltiples errores', () => {
    const errores = authService.validarRegistro({ nombre: '', correo: 'x', contrasena: '1' });
    expect(errores.length).toBeGreaterThanOrEqual(3);
  });

  test('validarRegistro acepta datos válidos', () => {
    const errores = authService.validarRegistro({
      nombre: 'Ana',
      correo: 'ana@test.com',
      contrasena: 'secret123',
    });
    expect(errores).toEqual([]);
  });

  test('registrarUsuario lanza 400 con datos inválidos', async () => {
    await expect(
      authService.registrarUsuario({ nombre: '', correo: 'malo', contrasena: '1' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('iniciarSesion lanza 400 sin credenciales', async () => {
    await expect(authService.iniciarSesion({})).rejects.toMatchObject({ statusCode: 400 });
  });

  test('obtenerPerfil lanza 404 si no existe', () => {
    expect(() => authService.obtenerPerfil(99999)).toThrow(/no encontrado/i);
  });
});
