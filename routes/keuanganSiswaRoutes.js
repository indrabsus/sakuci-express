const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarKategori,
  buatKategori,
  updateKategori,
  hapusKategori,
  detailKategoriSiswa,
  catatPembayaran,
  daftarPembayaranSiswa,
  hapusPembayaran,
} = require("../controllers/keuanganSiswaController");

const router = express.Router();

router.get("/kategori", proteksi, requireRole("kajur"), daftarKategori);
router.post("/kategori", proteksi, requireRole("kajur"), buatKategori);
router.put("/kategori/:id", proteksi, requireRole("kajur"), updateKategori);
router.delete("/kategori/:id", proteksi, requireRole("kajur"), hapusKategori);
router.get("/kategori/:id/siswa", proteksi, requireRole("kajur"), detailKategoriSiswa);

router.post("/pembayaran", proteksi, requireRole("kajur"), catatPembayaran);
router.get("/pembayaran/:id_kategori/:id_siswa", proteksi, requireRole("kajur"), daftarPembayaranSiswa);
router.delete("/pembayaran/:id", proteksi, requireRole("kajur"), hapusPembayaran);

module.exports = router;
