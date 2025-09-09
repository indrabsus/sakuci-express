const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { detailSiswa, detailUser, updateSiswa, updateUser, dataSiswa } = require('../controllers/dataController');
const router = express.Router();

router.get('/siswa/:tingkat?/:id_kelas?',proteksi, dataSiswa);
router.get('/detailsiswa/:id_siswa/',proteksi, detailSiswa);
router.get('/detailuser/:id_user/',proteksi, detailUser);
router.put('/updatesiswa/:id_siswa',proteksi, updateSiswa);
router.put('/updateuser/:id_user',proteksi, updateUser);

module.exports = router;
