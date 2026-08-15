const express = require("express");
const multer = require("multer");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { daftarSoal, buatSoal, updateSoal, hapusSoal, uploadGambarSoal } = require("../controllers/bankSoalController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File harus berupa gambar."));
    }
    cb(null, true);
  },
});

router.get("/", proteksi, requireRole("guru"), daftarSoal);
router.post("/", proteksi, requireRole("guru"), buatSoal);
router.put("/:id", proteksi, requireRole("guru"), updateSoal);
router.delete("/:id", proteksi, requireRole("guru"), hapusSoal);
router.post("/upload-gambar", proteksi, requireRole("guru"), upload.single("gambar"), uploadGambarSoal);

module.exports = router;
