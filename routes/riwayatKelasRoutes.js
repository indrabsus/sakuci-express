const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const {
  riwayatSiswa,
  kelasTerkini,
  riwayatByTahun,
  daftarTahunAjaran,
  createRiwayat,
  naikKelas,
  deleteRiwayat,
  tahunAjaranAktif,
} = require('../controllers/riwayatKelasController');

const router = express.Router();

router.get('/tahun-aktif', proteksi, tahunAjaranAktif);
router.get('/tahun-list', proteksi, daftarTahunAjaran);
router.get('/siswa/:id_siswa', proteksi, riwayatSiswa);
router.get('/terkini/:id_siswa', proteksi, kelasTerkini);
router.get('/tahun', proteksi, riwayatByTahun);
router.post('/', proteksi, createRiwayat);
router.post('/naik-kelas', proteksi, naikKelas);
router.delete('/:id_riwayat', proteksi, deleteRiwayat);

module.exports = router;
