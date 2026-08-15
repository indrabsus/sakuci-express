const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarSiswaJurusan,
  daftarCatatanSiswa,
  buatCatatanSiswa,
  hapusCatatanSiswa,
} = require("../controllers/catatanSiswaController");

const router = express.Router();

router.get("/siswa-jurusan", proteksi, requireRole("kajur"), daftarSiswaJurusan);
router.get("/:id_siswa", proteksi, requireRole("kajur"), daftarCatatanSiswa);
router.post("/", proteksi, requireRole("kajur"), buatCatatanSiswa);
router.delete("/:id", proteksi, requireRole("kajur"), hapusCatatanSiswa);

module.exports = router;
