// routes/rfid.js
const express = require('express');
const router = express.Router();
const { rfidGlobal } = require('../controllers/rfidController');

router.get('/global/:norfid/:kode_mesin', rfidGlobal);

module.exports = router;