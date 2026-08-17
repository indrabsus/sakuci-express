const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { daftarMateri, buatMateri, updateMateri, hapusMateri, daftarMateriSiswa } = require("../controllers/materiAjarController");

const router = express.Router();

router.get("/siswa", proteksi, requireRole("siswa"), daftarMateriSiswa);
router.get("/", proteksi, requireRole("guru"), daftarMateri);
router.post("/", proteksi, requireRole("guru"), buatMateri);
router.put("/:id", proteksi, requireRole("guru"), updateMateri);
router.delete("/:id", proteksi, requireRole("guru"), hapusMateri);

module.exports = router;
