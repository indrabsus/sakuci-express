const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { rekapNilai, simpanRekapNilai } = require("../controllers/rekapNilaiController");

const router = express.Router();

router.get("/", proteksi, requireRole("guru"), rekapNilai);
router.post("/simpan", proteksi, requireRole("guru"), simpanRekapNilai);

module.exports = router;
