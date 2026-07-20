const express = require('express');
const { dataKelas } = require('../controllers/kelasController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:tingkat?', dataKelas);

module.exports = router;