// routes/rfid.js
const express = require('express');
const router = express.Router();
const { rfidGlobal, getTemp, deleteTemp, masterRfid, createMaster, updateMaster, deleteMaster} = require('../controllers/rfidController');

router.get('/global/:norfid/:kode_mesin', rfidGlobal);
router.get('/get', getTemp);
router.get('/master/:id_rfid?', masterRfid);
router.post('/createmaster/', createMaster);
router.put('/updatemaster/:id_rfid', updateMaster);
router.delete('/deletemaster/:id_rfid', deleteMaster);
router.delete('/deletetemp/:kode_mesin', deleteTemp);

module.exports = router;