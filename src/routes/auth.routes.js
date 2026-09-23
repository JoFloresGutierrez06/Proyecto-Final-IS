const express = require('express');
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);

module.exports = router;
