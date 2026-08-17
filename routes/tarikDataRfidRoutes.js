const express = require("express");
const { tarikDataRfid } = require("../controllers/presensiController");

const router = express.Router();

// Tarik absen dari kartu RFID (mesin custom di master_rfid).
router.get("/", tarikDataRfid);

module.exports = router;
