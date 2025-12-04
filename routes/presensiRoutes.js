const express = require('express');
const { deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, logRfid } = require('../controllers/presensiController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
router.put('/updateharian/:id_harian', updateHarian);
router.delete('/deleteharian/:id_harian', deleteHarian);
router.get('/detailharian/:id_harian', detailHarian);
router.get('/presensiharian/:id_kelas?', presensiHarian);
router.get('/cekharian/:id_siswa', cekHarian);
router.get('/logrfid/:url/:mesin', logRfid);

module.exports = router;