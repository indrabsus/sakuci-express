const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb, kelas, postKelas, tampilKelas } = require('../controllers/ppdbController');
const router = express.Router();

router.get('/siswa/:tahun/:status?', proteksi,  dataSiswa);
router.get('/kelasppdb/:tahun', kelas)
router.get('/tampilkelas/:id_siswa', tampilKelas)
router.post('/postkelas', postKelas)
router.get('/log/:tahun', proteksi, logPpdb);
router.get('/detailsiswa/:id_siswa/:tahun', proteksi, detailSiswa);
router.post('/daftar', regisSiswa);
router.get('/jurusan', jurusan);
router.post('/bayardaftar', proteksi, bayarDaftar);
router.post('/bayarppdb', proteksi, bayarPpdb);
router.delete('/deletelog', proteksi, deleteLog);

module.exports = router;
