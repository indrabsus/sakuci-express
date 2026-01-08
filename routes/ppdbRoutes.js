const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb, kelas, postKelas, tampilKelas, updateKelas, deleteKelas, hitungSiswa, siswaKelas, deleteSiswa, leaveSiswa, updateSiswa,
createJurusan, masterPpdb, jurusanDetail, updateJurusan, deleteJurusan, createKelas, kelasDetail, logPpdbDetail,
updateLog,
createMaster,
updateMaster,
deleteMaster
    
} = require('../controllers/ppdbController');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/bukti/");
  },
  filename: (req, file, cb) => {
    // ambil ekstensi file asli
    const ext = path.extname(file.originalname);

    // buat nama file unik pakai random hex + timestamp
    const uniqueName =
      crypto.randomBytes(16).toString("hex") + "-" + Date.now() + ext;

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.get('/siswa/:tahun/:status?', dataSiswa);
router.put('/updatesiswa', proteksi, updateSiswa)
router.put('/updatelog/:id_log', proteksi,upload.single("bukti"), updateLog)
router.delete('/deletesiswa', proteksi, deleteSiswa)
router.post('/undursiswa',proteksi, leaveSiswa)

router.get('/tampilkelas', tampilKelas)
router.post('/postkelas', postKelas)
router.get('/log/:tahun', logPpdb);
router.get('/logdetail/:id_log?', logPpdbDetail);
router.get('/detailsiswa/:id_siswa/:tahun', detailSiswa);
router.post('/daftar', regisSiswa);

router.post('/bayardaftar', proteksi,upload.single("bukti"), bayarDaftar);
router.post('/bayarppdb', proteksi, upload.single("bukti"), bayarPpdb);
router.delete('/deletelog/:id_log', proteksi, deleteLog);

router.get('/jurusan/:id_jurusan?', jurusan);
router.post('/createjurusan',proteksi, createJurusan)
router.put('/updatejurusan/:id_jurusan', proteksi,updateJurusan)
router.delete('/deletejurusan/:id_jurusan',proteksi, deleteJurusan)

router.get('/masterppdb/:id_ppdb?', masterPpdb);
router.post('/createmaster', createMaster);
router.put('/updatemaster/:id_ppdb', updateMaster);
router.delete('/deletemaster/:id_ppdb', deleteMaster);


router.get('/kelas', kelas)
router.get('/hitungsiswa/:id_kelas', hitungSiswa)
router.get('/detailkelas/:id_kelas?', kelasDetail);
router.post('/createkelas', createKelas)
router.put('/updatekelas/:id_kelas', proteksi, updateKelas)
router.delete('/deletekelas/:id_kelas', proteksi, deleteKelas)

router.get('/siswakelas/:tahun?/:id_kelas?', siswaKelas)
module.exports = router;
