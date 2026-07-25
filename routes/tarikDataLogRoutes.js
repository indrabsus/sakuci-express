const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const { catatLog, getLog } = require("../controllers/tarikDataLogController");

const router = express.Router();

router.get("/", proteksi, getLog);
router.post("/", proteksi, catatLog);

module.exports = router;
