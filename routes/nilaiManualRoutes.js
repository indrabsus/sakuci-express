const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarNilaiManual,
  buatNilaiManual,
  rosterNilaiManual,
  simpanNilaiManual,
  hapusNilaiManual,
} = require("../controllers/nilaiManualController");

const router = express.Router();

router.get("/", proteksi, requireRole("guru"), daftarNilaiManual);
router.post("/", proteksi, requireRole("guru"), buatNilaiManual);
router.get("/roster", proteksi, requireRole("guru"), rosterNilaiManual);
router.post("/simpan", proteksi, requireRole("guru"), simpanNilaiManual);
router.delete("/:id", proteksi, requireRole("guru"), hapusNilaiManual);

module.exports = router;
