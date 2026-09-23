const { requireRole } = require('../src/middleware/roles');

function mockReq(rol) {
  return rol ? { usuario: { sub: 1, rol } } : {};
}

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('Middleware requireRole (autorización por roles)', () => {
  test('permite pasar si el rol está permitido', () => {
    const middleware = requireRole('administrador');
    const req = mockReq('administrador');
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  test('permite si cualquiera de los roles permitidos coincide', () => {
    const middleware = requireRole('administrador', 'usuario');
    const next = jest.fn();
    middleware(mockReq('usuario'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('devuelve 403 si el rol no está permitido', () => {
    const middleware = requireRole('administrador');
    const req = mockReq('usuario');
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.mensaje).toMatch(/permisos/i);
    expect(res.body.rolActual).toBe('usuario');
    expect(res.body.rolRequerido).toEqual(['administrador']);
  });

  test('devuelve 401 si no hay usuario en la request', () => {
    const middleware = requireRole('administrador');
    const res = mockRes();
    const next = jest.fn();

    middleware(mockReq(null), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
