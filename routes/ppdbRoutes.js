const express = require('express');
const { dataSiswa, regisSiswa, jurusan } = require('../controllers/ppdbController');
const router = express.Router();

router.get('/siswa', dataSiswa);
router.post('/daftar', regisSiswa);
router.get('/jurusan', jurusan);

module.exports = router;
