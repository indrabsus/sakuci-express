const express = require('express');
const {
  deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, createHarian,
  logRfid, tarik, absenGuru, absenTendik, absenStaf, rekapKehadiran, rekapHarianSiswa,
  rekapBulananGuru, rekapBulananTendik,
  createAbsenGuru, updateAbsenGuru, deleteAbsenGuru,
} = require('../controllers/presensiController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
const requireRole = require('../middleware/roleMiddleware');

router.put('/updateharian/:id_harian', proteksi,updateHarian);
router.delete('/deleteharian/:id_harian', proteksi,deleteHarian);
router.get('/detailharian/:id_harian',proteksi, detailHarian);
router.get('/presensiharian/:kelas?',proteksi, presensiHarian);
router.get('/rekap-harian-siswa', proteksi, rekapHarianSiswa);
router.post('/harian', proteksi, requireRole('manajemen', 'admin'), createHarian);
router.get('/cekharian/:id_siswa', proteksi,cekHarian);
router.get('/logrfid/:url?/:mesin?', proteksi,logRfid);
router.get('/tarik/:ip/:mesin', proteksi,tarik);
router.get('/absenguru',absenGuru);
router.get('/absentendik', proteksi, absenTendik);
router.post('/absenguru', proteksi, requireRole('manajemen', 'admin'), createAbsenGuru);
router.put('/absenguru/:id_absen', proteksi, requireRole('manajemen', 'admin'), updateAbsenGuru);
router.delete('/absenguru/:id_absen', proteksi, requireRole('manajemen', 'admin'), deleteAbsenGuru);
router.get('/absen-staf/:id_user', proteksi, absenStaf);
router.get('/rekap-bulanan-guru', proteksi, requireRole('admin'), rekapBulananGuru);
router.get('/rekap-bulanan-tendik', proteksi, requireRole('admin'), rekapBulananTendik);
router.get('/rekap-kehadiran/:uid_fp', rekapKehadiran); // tanpa proteksi, dipanggil aplikasi eksternal (Supabase) via uid_fp

module.exports = router;
