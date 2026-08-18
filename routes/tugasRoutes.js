const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarTugas,
  buatTugas,
  updateTugas,
  hapusTugas,
  daftarSoalTugas,
  tambahSoalTugas,
  hapusSoalTugas,
  daftarPengumpulan,
  detailPengumpulan,
  nilaiPengumpulan,
} = require("../controllers/tugasController");

const router = express.Router();

router.get("/", proteksi, requireRole("guru"), daftarTugas);
router.post("/", proteksi, requireRole("guru"), buatTugas);
router.put("/:id", proteksi, requireRole("guru"), updateTugas);
router.delete("/:id", proteksi, requireRole("guru"), hapusTugas);

router.get("/:id/soal", proteksi, requireRole("guru"), daftarSoalTugas);
router.post("/:id/soal", proteksi, requireRole("guru"), tambahSoalTugas);
router.delete("/soal/:idTugasSoal", proteksi, requireRole("guru"), hapusSoalTugas);

router.get("/:id/pengumpulan", proteksi, requireRole("guru"), daftarPengumpulan);
router.get("/:id/pengumpulan/:idPengumpulan", proteksi, requireRole("guru"), detailPengumpulan);
router.put("/:id/pengumpulan/:idPengumpulan/nilai", proteksi, requireRole("guru"), nilaiPengumpulan);

module.exports = router;
