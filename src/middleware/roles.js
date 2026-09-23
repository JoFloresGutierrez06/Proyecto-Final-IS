function requireRole(...rolesPermitidos) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: 'No tienes permisos para realizar esta acción',
        rolRequerido: rolesPermitidos,
        rolActual: req.usuario.rol,
      });
    }

    return next();
  };
}

module.exports = { requireRole };
