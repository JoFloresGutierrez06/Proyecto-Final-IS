const bcrypt = require('bcryptjs');
const { asegurarAdmin, variablesDeAdminDefinidas } = require('../src/services/seedService');
const userRepository = require('../src/repositories/userRepository');
const env = require('../src/config/env');

describe('seedService - asegurarAdmin', () => {
  test('crea el administrador cuando no existe (accion: creado)', async () => {
    const resultado = await asegurarAdmin();
    expect(resultado.accion).toBe('creado');
    expect(resultado.correo).toBe(env.admin.email.toLowerCase());

    const guardado = userRepository.encontrarPorCorreo(env.admin.email);
    expect(guardado).not.toBeNull();
    expect(guardado.rol).toBe('administrador');
    expect(guardado.contrasena).not.toBe(env.admin.password);
    expect(await bcrypt.compare(env.admin.password, guardado.contrasena)).toBe(true);
  });

  test('no duplica si ya existe y coincide (accion: sin-cambios)', async () => {
    await asegurarAdmin();
    const idOriginal = userRepository.encontrarPorCorreo(env.admin.email).id;

    const segunda = await asegurarAdmin();
    expect(segunda.accion).toBe('sin-cambios');
    expect(userRepository.encontrarPorCorreo(env.admin.email).id).toBe(idOriginal);
    expect(userRepository.contarUsuarios()).toBe(1);
  });

  test('corrige un usuario existente con otro rol (accion: actualizado)', async () => {
    const hash = await bcrypt.hash('clave-vieja', 10);
    userRepository.crear({
      nombre: 'Usuario Promovido',
      correo: env.admin.email,
      contrasena: hash,
      rol: 'usuario',
    });

    const resultado = await asegurarAdmin();
    expect(resultado.accion).toBe('actualizado');

    const guardado = userRepository.encontrarPorCorreo(env.admin.email);
    expect(guardado.rol).toBe('administrador');
    expect(await bcrypt.compare(env.admin.password, guardado.contrasena)).toBe(true);
  });

  test('corrige la contraseña si no coincide (accion: actualizado)', async () => {
    const hash = await bcrypt.hash('contrasena-anterior', 10);
    userRepository.crear({
      nombre: 'Admin Viejo',
      correo: env.admin.email,
      contrasena: hash,
      rol: 'administrador',
    });

    const resultado = await asegurarAdmin();
    expect(resultado.accion).toBe('actualizado');
    expect(await bcrypt.compare(env.admin.password, userRepository.encontrarPorCorreo(env.admin.email).contrasena)).toBe(true);
  });

  test('falla con credenciales de admin inválidas (400)', async () => {
    const original = env.admin.password;
    env.admin.password = '123';
    try {
      await expect(asegurarAdmin()).rejects.toMatchObject({ statusCode: 400 });
    } finally {
      env.admin.password = original;
    }
  });
});

describe('seedService - variablesDeAdminDefinidas', () => {
  test('devuelve true cuando ADMIN_EMAIL y ADMIN_PASSWORD están en el entorno', () => {
    expect(variablesDeAdminDefinidas()).toBe(true);
  });

  test('devuelve false cuando falta alguna variable', () => {
    const email = process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAIL;
    expect(variablesDeAdminDefinidas()).toBe(false);
    process.env.ADMIN_EMAIL = email;
  });
});
