const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { detailSiswa, detailUser, updateSiswa, updateUser, dataSiswa, dataUser, 
    dataMapel, createUser, deleteUser, dataUserFp, 
    dataGuru} = require('../controllers/dataController');
const router = express.Router();

router.get('/siswa/:tingkat?/:id_kelas?', dataSiswa);
router.get('/user/:id_data?', dataUser);
router.get('/guru/', dataGuru);
router.get('/userfp/:uid_fp?', dataUserFp);
router.post('/createuser', createUser);
router.get('/mapel', dataMapel);
router.get('/detailsiswa/:id_siswa/',proteksi, detailSiswa);
router.get('/detailuser/:id_user/',proteksi, detailUser);
router.put('/updatesiswa/:id_siswa',proteksi, updateSiswa);
router.put('/updateuser/:id_user',proteksi, updateUser);
router.delete('/deleteuser/:id_user',proteksi, deleteUser);

module.exports = router;
