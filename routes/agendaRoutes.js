const express = require('express');
const router = express.Router();
const { isiAgenda, cekUsername, getMateri, prosesAgenda, absenListSiswa } = require('../controllers/agendaController');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
router.get('/isi/:username', isiAgenda);
router.get('/user/:username', cekUsername);
router.get('/materi/:username', getMateri);
router.get('/absenlist/:id_materi', absenListSiswa);
router.get('/prosesmateri/:materi/:tingkat/:id_mapelkelas', prosesAgenda);

module.exports = router;