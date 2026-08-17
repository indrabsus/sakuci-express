const express = require("express");
const { tarikDataFp } = require("../controllers/tarikDataFpController");

const router = express.Router();

// Tarik absen staf/guru dari mesin fingerprint (ZKTeco).
router.get("/", tarikDataFp);

module.exports = router;
