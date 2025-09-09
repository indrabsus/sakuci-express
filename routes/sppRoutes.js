const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { masterSppData, logLastSpp, bayarSpp } = require('../controllers/sppController');
const router = express.Router();

router.get('/master/:tahun', masterSppData);
router.get('/loglast/:id_siswa', logLastSpp);

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/bukti/");
  },
  filename: (req, file, cb) => {
    // ambil ekstensi file asli
    const ext = path.extname(file.originalname);

    // buat nama file unik pakai random hex + timestamp
    const uniqueName =
      crypto.randomBytes(16).toString("hex") + "-" + Date.now() + ext;

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /spp/bayar
router.post("/bayar", upload.single("bukti"), bayarSpp);

module.exports = router;
