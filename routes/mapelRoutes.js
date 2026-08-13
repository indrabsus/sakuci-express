const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const {
  daftarMapel,
  createMapel,
  updateMapel,
  hapusMapel,
} = require('../controllers/mapelController');

const router = express.Router();

router.get('/', proteksi, daftarMapel);
router.post('/', proteksi, createMapel);
router.put('/:id_mapel', proteksi, updateMapel);
router.delete('/:id_mapel', proteksi, hapusMapel);

module.exports = router;
