const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { masterSppData, logLastSpp, bayarSpp, logSpp, detailLog, updateLog, deleteLog, createMaster, updateMaster, detailMaster, deleteMaster
} = require('../controllers/sppController');
const router = express.Router();

router.get('/master/:tahun?', masterSppData);
router.get('/detailmaster/:id_spp?', detailMaster);
router.post('/createmaster', createMaster);
router.put('/updatemaster/:id_spp', updateMaster);
router.delete('/deletemaster/:id_spp', deleteMaster);
router.get('/loglast/:id_siswa', proteksi, logLastSpp);
router.get('/log', proteksi, logSpp);
router.get('/logdetail/:id_logspp', proteksi, detailLog)
router.put('/updatelog/:id_logspp', proteksi, updateLog)
router.delete('/deletelog/:id_logspp', proteksi, deleteLog)

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
