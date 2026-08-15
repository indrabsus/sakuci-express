const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { daftarRiwayat, rosterAbsen, simpanAbsen, rekapAbsen, hapusSesi } = require("../controllers/absenKelasController");

const router = express.Router();

router.get("/riwayat", proteksi, requireRole("guru"), daftarRiwayat);
router.get("/roster", proteksi, requireRole("guru"), rosterAbsen);
router.post("/simpan", proteksi, requireRole("guru"), simpanAbsen);
router.get("/rekap", proteksi, requireRole("guru"), rekapAbsen);
router.delete("/:id", proteksi, requireRole("guru"), hapusSesi);

module.exports = router;
