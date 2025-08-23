const express = require('express');
const { authController } = require('../controllers/authController');
const { refreshTokenController } = require('../controllers/refreshTokenController');
const router = express.Router();

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', authController)
router.post('/refresh', refreshTokenController);
module.exports = router;
