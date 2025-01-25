const express = require('express');
const { authController } = require('../controllers/authController');
const router = express.Router();

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', authController)

module.exports = router;
