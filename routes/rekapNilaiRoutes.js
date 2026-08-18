const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { rekapNilai } = require("../controllers/rekapNilaiController");

const router = express.Router();

router.get("/", proteksi, requireRole("guru"), rekapNilai);

module.exports = router;
