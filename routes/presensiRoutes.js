const express = require('express');
const { deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, logRfid, tarik } = require('../controllers/presensiController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
router.put('/updateharian/:id_harian', proteksi,updateHarian);
router.delete('/deleteharian/:id_harian', proteksi,deleteHarian);
router.get('/detailharian/:id_harian',proteksi, detailHarian);
router.get('/presensiharian/:id_kelas?',proteksi, presensiHarian);
router.get('/cekharian/:id_siswa', proteksi,cekHarian);
router.get('/logrfid/:url?/:mesin?', logRfid);
router.get('/tarik/:ip/:mesin',tarik);

module.exports = router;