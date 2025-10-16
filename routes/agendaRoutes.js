const express = require('express');
const router = express.Router();
const { isiAgenda, cekUsername, getMateri, prosesAgenda, absenListSiswa, prosesAbsen, dataAgenda, deleteAgenda, createAgenda, dataJadwal, createJadwal, jadwalList, updateJadwal, deleteJadwal, hitungAgenda, hariJadwal, hariAgenda } = require('../controllers/agendaController');
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data/:id_agenda?', dataAgenda);
router.get('/hitung/:id_data/:bulan/:tahun', hitungAgenda);
router.get('/jadwal/:id_data/:hari/:jam_ke', dataJadwal);
router.get('/jadwallist/:id_jadwal?', jadwalList);
router.get('/harijadwal/:hari?', hariJadwal);
router.get('/agendasekarang', hariAgenda);
router.post('/createagenda/', createAgenda);
router.post('/createjadwal/', createJadwal);
router.put('/updatejadwal/:id_jadwal', updateJadwal);
router.delete('/deleteagenda/:id_agenda', deleteAgenda);
router.delete('/deletejadwal/:id_jadwal', deleteJadwal);

//agenda lama
router.get('/isi/:username', isiAgenda);
router.get('/user/:username', cekUsername);
router.get('/materi/:username', getMateri);
router.get('/absenlist/:id_materi', absenListSiswa);
router.get('/prosesmateri/:materi/:tingkat/:id_mapelkelas/:tahun', prosesAgenda);
router.get('/prosesabsen/:id_user/:id_materi/:waktu_agenda/:keterangan', prosesAbsen);

module.exports = router;