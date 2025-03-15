const express = require('express');
const { cekUsername, prosesMasukan } = require('../controllers/masukanController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/cekuser/:username', cekUsername);
router.post('/submit', prosesMasukan);

module.exports = router;