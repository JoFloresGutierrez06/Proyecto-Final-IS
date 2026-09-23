const express = require('express');
const donantesController = require('../controllers/donantesController');
const { verificarToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// Todas las rutas requieren JWT
router.use(verificarToken);

// administrador: crea donantes | ambos roles: consultan
router.post('/', requireRole('administrador'), donantesController.crear);
router.get('/', donantesController.listar);
router.get('/:id', donantesController.obtenerPorId);

module.exports = router;
