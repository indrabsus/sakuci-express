const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const {
  daftarTahunAjaran,
  createTahunAjaran,
  aktifkanTahunAjaran,
  hapusTahunAjaran,
} = require('../controllers/tahunAjaranController');

const router = express.Router();

router.get('/', proteksi, daftarTahunAjaran);
router.post('/', proteksi, createTahunAjaran);
router.patch('/:id_tahun_ajaran/aktifkan', proteksi, aktifkanTahunAjaran);
router.delete('/:id_tahun_ajaran', proteksi, hapusTahunAjaran);

module.exports = router;
