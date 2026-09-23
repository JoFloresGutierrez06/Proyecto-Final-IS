function manejarError(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const mensaje =
    statusCode === 500 ? 'Error interno del servidor' : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ mensaje });
}

module.exports = { manejarError };
