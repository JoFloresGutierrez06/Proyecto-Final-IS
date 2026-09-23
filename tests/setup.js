process.env.JWT_SECRET = 'secreto-de-pruebas-jwt';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'Admin1234!';
process.env.ADMIN_NAME = 'Admin Test';

const { reiniciarConexion, cerrarConexion } = require('../src/db/connection');

beforeEach(() => {
  reiniciarConexion(':memory:');
});

afterAll(() => {
  cerrarConexion();
});
