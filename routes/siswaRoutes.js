const express = require('express');
const { masterSiswa } = require('../controllers/siswaController');
const proteksi = require('../middleware/authMiddleware');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/master', proteksi, masterSiswa);
module.exports = router;
