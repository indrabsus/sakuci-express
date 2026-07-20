const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const {
  riwayatByTahun,
  daftarTahunAjaran,
  daftarKelasByTahun,
  createRiwayat,
  naikKelas,
  pindahKelas,
  deleteRiwayat,
  tahunAjaranAktif,
  belumMasukKelas,
} = require('../controllers/riwayatKelasController');

const router = express.Router();

router.get('/tahun-aktif', proteksi, tahunAjaranAktif);
router.get('/tahun-list', proteksi, daftarTahunAjaran);
router.get('/kelas-list', proteksi, daftarKelasByTahun);
router.get('/belum-kelas', proteksi, belumMasukKelas);
router.get('/tahun', proteksi, riwayatByTahun);
router.post('/', proteksi, createRiwayat);
router.post('/naik-kelas', proteksi, naikKelas);
router.post('/pindah', proteksi, pindahKelas);
router.delete('/:id_riwayat', proteksi, deleteRiwayat);

module.exports = router;
