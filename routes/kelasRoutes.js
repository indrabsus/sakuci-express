const express = require('express');
const { dataKelas, dataKelasDetail } = require('../controllers/kelasController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:tingkat?', dataKelas);
router.get('/data/:id', dataKelasDetail);

module.exports = router;