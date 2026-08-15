const express = require("express");
const { landingData, verifikasiSertifikat } = require("../controllers/publicController");

const router = express.Router();

router.get("/landing", landingData);
router.get("/verifikasi/:kode", verifikasiSertifikat);

module.exports = router;
