const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb, kelas, postKelas, tampilKelas, updateKelas, deleteKelas, hitungSiswa, siswaKelas, deleteSiswa, leaveSiswa, updateSiswa,
createJurusan, masterPpdb, jurusanDetail, updateJurusan, deleteJurusan, createKelas, kelasDetail
    
} = require('../controllers/ppdbController');
const router = express.Router();

router.get('/siswa/:tahun/:status?', proteksi,  dataSiswa);
router.put('/updatesiswa', proteksi, updateSiswa)
router.delete('/deletesiswa', proteksi, deleteSiswa)
router.post('/undursiswa',proteksi, leaveSiswa)

router.get('/tampilkelas/:id_siswa', tampilKelas)
router.post('/postkelas', postKelas)
router.get('/log/:tahun', proteksi, logPpdb);
router.get('/detailsiswa/:id_siswa/:tahun', proteksi, detailSiswa);
router.post('/daftar', regisSiswa);

router.post('/bayardaftar', proteksi, bayarDaftar);
router.post('/bayarppdb', proteksi, bayarPpdb);
router.delete('/deletelog', proteksi, deleteLog);

router.get('/jurusan/:tahun?', jurusan);
router.get('/detailjurusan/:id_jurusan?', jurusanDetail);
router.post('/createjurusan',proteksi, createJurusan)
router.put('/updatejurusan', proteksi,updateJurusan)
router.delete('/deletejurusan',proteksi, deleteJurusan)
router.get('/masterppdb', masterPpdb);

router.get('/kelasppdb/:tahun', kelas)
router.get('/hitungsiswa/:id_kelas', hitungSiswa)
router.get('/detailkelas/:id_kelas?', kelasDetail);
router.post('/createkelas', createKelas)
router.put('/updatekelas', proteksi, updateKelas)
router.delete('/deletekelas', proteksi, deleteKelas)

router.get('/siswakelas/:tahun?/:id_kelas?', siswaKelas)
module.exports = router;
