const express = require('express');
const multer = require('multer');
const proteksi = require('../middleware/authMiddleware');
const { uploadFotoProfil } = require('../controllers/profileController');

const router = express.Router();

// Buffer di memori (bukan disk) karena mau dikompres pakai sharp dulu
// sebelum ditulis ke uploads/profil - jadi tidak perlu file mentah tersimpan.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB, hasil akhir jauh lebih kecil setelah dikompres
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File harus berupa gambar.'));
    }
    cb(null, true);
  },
});

router.post('/foto', proteksi, upload.single('foto'), uploadFotoProfil);

module.exports = router;
