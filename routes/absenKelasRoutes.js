const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarRiwayat,
  rosterAbsen,
  simpanAbsen,
  rekapAbsen,
  hapusSesi,
  ringkasanHariIni,
  riwayatAbsenSiswa,
} = require("../controllers/absenKelasController");

const router = express.Router();

router.get("/siswa/riwayat", proteksi, requireRole("siswa"), riwayatAbsenSiswa);
router.get("/ringkasan-hari-ini", proteksi, requireRole("guru", "kurikulum", "adminkurikulum", "admin"), ringkasanHariIni);
router.get("/riwayat", proteksi, requireRole("guru", "kurikulum", "adminkurikulum", "admin"), daftarRiwayat);
router.get("/roster", proteksi, requireRole("guru", "kurikulum", "adminkurikulum", "admin"), rosterAbsen);
router.post("/simpan", proteksi, requireRole("guru"), simpanAbsen);
router.get("/rekap", proteksi, requireRole("guru", "kurikulum", "adminkurikulum", "admin"), rekapAbsen);
router.delete("/:id", proteksi, requireRole("guru"), hapusSesi);

module.exports = router;
