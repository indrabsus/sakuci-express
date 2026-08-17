const express = require("express");
const { tarikSemuaMesin } = require("../controllers/presensiController");

const router = express.Router();

// Setara https://sakuci.id/tarikdata - tanpa proteksi JWT karena dipanggil
// oleh cron/scheduler.
router.get("/", tarikSemuaMesin);

module.exports = router;
