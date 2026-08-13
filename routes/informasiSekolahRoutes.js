const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const {
  getInformasiSekolah,
  updateInformasiSekolah,
} = require('../controllers/informasiSekolahController');

const router = express.Router();

router.get('/', getInformasiSekolah);
router.put('/', proteksi, updateInformasiSekolah);

module.exports = router;
