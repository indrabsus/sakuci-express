const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarSiswaJurusan,
  daftarSertifikat,
  buatSertifikatManual,
  cabutSertifikat,
  aktifkanSertifikat,
  hapusSertifikat,
  detailCetakSertifikat,
  sertifikatSiswa,
} = require("../controllers/sertifikatController");

const router = express.Router();

router.get("/siswa", proteksi, requireRole("siswa"), sertifikatSiswa);
router.get("/siswa-jurusan", proteksi, requireRole("kajur"), daftarSiswaJurusan);
router.get("/manual", proteksi, requireRole("kajur"), daftarSertifikat);
router.post("/manual", proteksi, requireRole("kajur"), buatSertifikatManual);
router.get("/:id/cetak", proteksi, requireRole("kajur"), detailCetakSertifikat);
router.put("/:id/cabut", proteksi, requireRole("kajur"), cabutSertifikat);
router.put("/:id/aktifkan", proteksi, requireRole("kajur"), aktifkanSertifikat);
router.delete("/:id", proteksi, requireRole("kajur"), hapusSertifikat);

module.exports = router;
