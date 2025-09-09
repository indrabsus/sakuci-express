const express = require('express');
const { dataSiswa, siswaDetail, hitungSiswa } = require('../controllers/siswaController');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:tahun', dataSiswa);
router.get('/detail/:id_siswa', siswaDetail);
router.get('/jumlah/:tingkat/:status', hitungSiswa);
module.exports = router;