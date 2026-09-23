require('dotenv').config();

const env = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'secreto-temporal-solo-para-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  databasePath: process.env.DATABASE_PATH || 'data/app.db',
  nodeEnv: process.env.NODE_ENV || 'development',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@donaciones.com',
    password: process.env.ADMIN_PASSWORD || 'Admin1234!',
    name: process.env.ADMIN_NAME || 'Administrador',
  },
};

module.exports = env;
