const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { detailSiswa, updateUser, dataSiswa,
    createUser, deleteUser, dataTendik,
    dataGuru} = require('../controllers/dataController');
const router = express.Router();

router.get('/siswa/:tingkat?/:id_kelas?', dataSiswa);
router.get('/guru/', dataGuru); //jangan pake proteksi nanti ga bisa isi agenda
router.get('/tendik/', dataTendik);
router.post('/createuser',proteksi, createUser);
router.get('/detailsiswa/:id_siswa/',proteksi, detailSiswa);
router.put('/updateuser/:id_data',proteksi, updateUser);
router.delete('/deleteuser/:id_user',proteksi, deleteUser);

module.exports = router;
