const express = require('express');
const router = express.Router();
const { isiAgenda, cekUsername, getMateri, prosesAgenda, absenListSiswa, prosesAbsen } = require('../controllers/agendaController');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
router.get('/isi/:username', isiAgenda);
router.get('/user/:username', cekUsername);
router.get('/materi/:username', getMateri);
router.get('/absenlist/:id_materi', absenListSiswa);
router.get('/prosesmateri/:materi/:tingkat/:id_mapelkelas/:tahun', prosesAgenda);
router.get('/prosesabsen/:id_user/:id_materi/:waktu_agenda/:keterangan', prosesAbsen);

module.exports = router;