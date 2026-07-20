const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const router = express.Router();
const { cekUsername, getMateri, prosesAgenda, prosesAbsen, dataAgenda, deleteAgenda, createAgenda, hitungAgenda, hariAgenda } = require('../controllers/agendaController');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id_agenda?', dataAgenda);
router.get('/hitung/:id_data/:bulan/:tahun', hitungAgenda);
router.get('/agendasekarang', hariAgenda);
router.post('/createagenda/', createAgenda);
router.delete('/deleteagenda/:id_agenda', deleteAgenda);

//agenda lama
router.get('/user/:username', cekUsername);
router.get('/materi/:username', getMateri);
router.get('/prosesmateri/:materi/:tingkat/:id_mapelkelas/:tahun', prosesAgenda);
router.get('/prosesabsen/:id_user/:id_materi/:waktu_agenda/:keterangan', prosesAbsen);

module.exports = router;
