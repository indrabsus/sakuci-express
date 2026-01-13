const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const uploadDokumen = require('../middleware/uploadDokumen');
const { detailSiswa, detailUser, updateSiswa, updateUser, dataSiswa, dataUser, 
    dataMapel, createUser, deleteUser, dataUserFp, 
    dataGuru,
    deleteSiswa,
    hitungAbsen,
    dokumenData, uploadData,
    updateDokumen,
    deleteDokumen} = require('../controllers/dataController');
const router = express.Router();

router.get('/siswa/:tingkat?/:id_kelas?',proteksi, dataSiswa);
router.get('/user/:id_data?', dataUser);
router.get('/hitungabsen/:id_siswa/:id_data?/:id_mapel?/:bulan?/:tahun?', proteksi, hitungAbsen);
router.get('/guru/', dataGuru); //jangan pake proteksi nanti ga bisa isi agenda
router.get('/userfp/:uid_fp?',proteksi, dataUserFp);
router.post('/createuser',proteksi, createUser);
router.get('/mapel',dataMapel); //jangan pake proteksi nanti ga bisa isi agenda
router.get('/detailsiswa/:id_siswa/',proteksi, detailSiswa);
router.get('/detailuser/:id_user/',proteksi, detailUser);
router.put('/updatesiswa/:id_siswa',proteksi, updateSiswa);
router.put('/updateuser/:id_data',proteksi, updateUser);
router.delete('/deleteuser/:id_user',proteksi, deleteUser);
router.delete('/deletesiswa/:id_siswa',proteksi, deleteSiswa);
router.get('/dokumen/:id_dokumen?', proteksi,dokumenData);
router.put('/updatedokumen/:id_dokumen', proteksi,updateDokumen);
router.post("/upload", uploadDokumen.single("file"),proteksi, uploadData);
router.delete('/deletedokumen/:id_dokumen',proteksi, deleteDokumen);

module.exports = router;
