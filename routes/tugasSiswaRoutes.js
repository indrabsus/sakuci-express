const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { daftarTugasSiswa, detailTugasSiswa, submitTugasSiswa, hasilTugasSiswa } = require("../controllers/tugasSiswaController");

const router = express.Router();

router.get("/", proteksi, requireRole("siswa"), daftarTugasSiswa);
router.get("/:id_tugas", proteksi, requireRole("siswa"), detailTugasSiswa);
router.post("/:id_tugas/submit", proteksi, requireRole("siswa"), submitTugasSiswa);
router.get("/:id_tugas/hasil", proteksi, requireRole("siswa"), hasilTugasSiswa);

module.exports = router;
