const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { daftarMengajar, buatMengajar, hapusMengajar } = require("../controllers/mengajarController");

const router = express.Router();

router.get("/", proteksi, requireRole("guru"), daftarMengajar);
router.post("/", proteksi, requireRole("guru"), buatMengajar);
router.delete("/:id", proteksi, requireRole("guru"), hapusMengajar);

module.exports = router;
