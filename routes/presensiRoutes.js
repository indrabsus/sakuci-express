const express = require('express');
const { deleteHarian, updateHarian, detailHarian } = require('../controllers/presensiController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
router.put('/updateharian/:id_harian', updateHarian);
router.delete('/deleteharian/:id_harian', deleteHarian);
router.get('/detailharian/:id_harian', detailHarian);

module.exports = router;