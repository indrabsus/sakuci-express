// routes/rfid.js
const express = require('express');
const router = express.Router();
const { rfidGlobal, getTemp, deleteTemp } = require('../controllers/rfidController');

router.get('/global/:norfid/:kode_mesin', rfidGlobal);
router.get('/get', getTemp);
router.delete('/deletetemp/:kode_mesin', deleteTemp);

module.exports = router;