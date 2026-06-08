const express = require('express');
const { authController, changePassword } = require('../controllers/authController');
const { refreshTokenController } = require('../controllers/refreshTokenController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware');

// Endpoint untuk login dan menghasilkan JWT
router.post('/login', authController)
router.post('/refresh', refreshTokenController);
router.post("/change-password", proteksi, changePassword);

module.exports = router;
