// routes/rfid.js
const express = require('express');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware');
const { rfidGlobal, getTemp, deleteTemp, masterRfid, createMaster, updateMaster, deleteMaster} = require('../controllers/rfidController');

router.get('/global/:norfid/:kode_mesin', rfidGlobal);
router.get('/get', getTemp);
router.get('/master/:id_rfid?', proteksi, masterRfid);
router.post('/createmaster/', proteksi, createMaster);
router.put('/updatemaster/:id_rfid', proteksi, updateMaster);
router.delete('/deletemaster/:id_rfid', proteksi, deleteMaster);
router.delete('/deletetemp/:kode_mesin', deleteTemp);

module.exports = router;