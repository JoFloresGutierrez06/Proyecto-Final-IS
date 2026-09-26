const donanteService = require('../services/donanteService');

function crear(req, res, next) {
  try {
    const donante = donanteService.crearDonante(req.body);
    res.status(201).json({ mensaje: 'Donante registrado correctamente', donante });
  } catch (error) {
    next(error);
  }
}

function listar(req, res, next) {
  try {
    const donantes = donanteService.listarDonantes();
    res.json({ total: donantes.length, donantes });
  } catch (error) {
    next(error);
  }
}

function obtenerPorId(req, res, next) {
  try {
    const donante = donanteService.obtenerDonante(req.params.id);
    res.json({ donante });
  } catch (error) {
    next(error);
  }
}

function actualizar(req, res, next) {
  try {
    const donante = donanteService.actualizarDonante(req.params.id, req.body);
    res.json({ mensaje: 'Donante actualizado correctamente', donante });
  } catch (error) {
    next(error);
  }
}

function eliminar(req, res, next) {
  try {
    const donante = donanteService.eliminarDonante(req.params.id);
    res.json({ mensaje: 'Donante eliminado correctamente', donante });
  } catch (error) {
    next(error);
  }
}

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };
