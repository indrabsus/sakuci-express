const express = require('express');
const { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb } = require('../controllers/ppdbController');
const router = express.Router();

router.get('/siswa/:tahun/:status?', dataSiswa);
router.get('/log/:tahun', logPpdb);
router.get('/detailsiswa/:id_siswa/:tahun', detailSiswa);
router.post('/daftar', regisSiswa);
router.get('/jurusan', jurusan);
router.post('/bayardaftar', bayarDaftar);
router.post('/bayarppdb', bayarPpdb);
router.delete('/deletelog', deleteLog);

module.exports = router;
