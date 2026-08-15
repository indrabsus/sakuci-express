const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  daftarProjectKajur,
  reviewProject,
  daftarProjectSiswa,
  buatProjectSiswa,
  ubahProjectSiswa,
  hapusProjectSiswa,
} = require("../controllers/projectSiswaController");

const router = express.Router();

router.get("/kajur", proteksi, requireRole("kajur"), daftarProjectKajur);
router.put("/:id/review", proteksi, requireRole("kajur"), reviewProject);

router.get("/siswa", proteksi, requireRole("siswa"), daftarProjectSiswa);
router.post("/siswa", proteksi, requireRole("siswa"), buatProjectSiswa);
router.put("/siswa/:id", proteksi, requireRole("siswa"), ubahProjectSiswa);
router.delete("/siswa/:id", proteksi, requireRole("siswa"), hapusProjectSiswa);

module.exports = router;
