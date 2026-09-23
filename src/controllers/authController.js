const authService = require('../services/authService');

async function registrar(req, res, next) {
  try {
    const usuario = await authService.registrarUsuario(req.body);
    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const resultado = await authService.iniciarSesion(req.body);
    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    next(error);
  }
}

function perfil(req, res, next) {
  try {
    const usuario = authService.obtenerPerfil(req.usuario.sub);
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
}

module.exports = { registrar, login, perfil };
