const express = require('express');
const proteksi = require('../middleware/authMiddleware');
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb, kelas, postKelas, tampilKelas, updateKelas, deleteKelas, hitungSiswa, siswaKelas, deleteSiswa, leaveSiswa, updateSiswa,
createJurusan, masterPpdb, jurusanDetail, updateJurusan, deleteJurusan, createKelas, kelasDetail
    
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

router.get('/siswa/:tahun/:status?', proteksi,  dataSiswa);
router.put('/updatesiswa', proteksi, updateSiswa)
router.delete('/deletesiswa', proteksi, deleteSiswa)
router.post('/undursiswa',proteksi, leaveSiswa)

router.get('/tampilkelas/:id_siswa', tampilKelas)
router.post('/postkelas', postKelas)
router.get('/log/:tahun', proteksi, logPpdb);
router.get('/detailsiswa/:id_siswa/:tahun', detailSiswa);
router.post('/daftar', regisSiswa);

router.post('/bayardaftar', proteksi, bayarDaftar);
router.post('/bayarppdb', proteksi, upload.single("bukti"), bayarPpdb);
router.delete('/deletelog', proteksi, deleteLog);

router.get('/jurusan/:tahun?', jurusan);
router.get('/detailjurusan/:id_jurusan?', jurusanDetail);
router.post('/createjurusan',proteksi, createJurusan)
router.put('/updatejurusan', proteksi,updateJurusan)
router.delete('/deletejurusan',proteksi, deleteJurusan)
router.get('/masterppdb/:tahun?', masterPpdb);

router.get('/kelasppdb/:tahun', kelas)
router.get('/hitungsiswa/:id_kelas', hitungSiswa)
router.get('/detailkelas/:id_kelas?', kelasDetail);
router.post('/createkelas', createKelas)
router.put('/updatekelas', proteksi, updateKelas)
router.delete('/deletekelas', proteksi, deleteKelas)

router.get('/siswakelas/:tahun?/:id_kelas?', siswaKelas)
module.exports = router;
