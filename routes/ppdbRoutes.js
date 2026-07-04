const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const {
  dataSiswa,
  regisSiswa,
  jurusan,
  bayarDaftar,
  deleteLog,
  detailSiswa,
  bayarPpdb,
  logPpdb,
  kelas,
  postKelas,
  tampilKelas,
  updateKelas,
  deleteKelas,
  hitungSiswa,
  siswaKelas,
  deleteSiswa,
  leaveSiswa,
  updateSiswa,
  createJurusan,
  masterPpdb,
  jurusanDetail,
  updateJurusan,
  deleteJurusan,
  createKelas,
  kelasDetail,
  logPpdbDetail,
  deleteKelasSiswa,
  updateLog,
  createMaster,
  updateMaster,
  deleteMaster,
  laporanPpdb,
  trfServer,
  backupJson,
  restoreJson
} = require("../controllers/ppdbController");

const router = express.Router();

/* =========================
   UPLOAD BUKTI PEMBAYARAN
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/bukti/";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const uniqueName =
      crypto.randomBytes(16).toString("hex") + "-" + Date.now() + ext;

    cb(null, uniqueName);
  },
});

const upload = multer({ storage });



/* =========================
   SISWA
========================= */

router.get("/siswa/:tahun/:status?", proteksi, dataSiswa);
router.get("/detailsiswa/:id_siswa/:tahun", proteksi, detailSiswa);
router.put("/updatesiswa", proteksi, updateSiswa);
router.delete("/deletesiswa", proteksi, deleteSiswa);
router.post("/undursiswa", proteksi, leaveSiswa);

/* =========================
   PENDAFTARAN PUBLIC
========================= */

router.post("/daftar", regisSiswa);
router.post("/trfserver", trfServer);

/* =========================
   PEMBAYARAN
========================= */

router.post("/bayardaftar", proteksi, upload.single("bukti"), bayarDaftar);
router.post("/bayarppdb", proteksi, upload.single("bukti"), bayarPpdb);

/* =========================
   LOG PPDB
========================= */

router.get("/log/:tahun", proteksi, logPpdb);
router.get("/logdetail/:id_log?", proteksi, logPpdbDetail);
router.put("/updatelog/:id_log", proteksi, upload.single("bukti"), updateLog);
router.delete("/deletelog/:id_log", proteksi, deleteLog);

/* =========================
   LAPORAN
========================= */

router.get("/laporan/:tahun", laporanPpdb);

/* =========================
   JURUSAN
========================= */

router.get("/jurusan/:id_jurusan?", proteksi, jurusan);
router.post("/createjurusan", proteksi, createJurusan);
router.put("/updatejurusan/:id_jurusan", proteksi, updateJurusan);
router.delete("/deletejurusan/:id_jurusan", proteksi, deleteJurusan);

/* =========================
   MASTER PPDB
========================= */

router.get("/masterppdb/:id_ppdb?", masterPpdb);
router.post("/createmaster", proteksi, createMaster);
router.put("/updatemaster/:id_ppdb", proteksi, updateMaster);
router.delete("/deletemaster/:id_ppdb", proteksi, deleteMaster);

/* =========================
   KELAS
========================= */

router.get("/kelas", proteksi, kelas);
router.get("/hitungsiswa/:id_kelas", proteksi, hitungSiswa);
router.get("/detailkelas/:id_kelas?", proteksi, kelasDetail);
router.post("/createkelas", proteksi, createKelas);
router.put("/updatekelas/:id_kelas", proteksi, updateKelas);
router.delete("/deletekelas/:id_kelas", proteksi, deleteKelas);

router.get("/tampilkelas", proteksi, tampilKelas);
router.post("/postkelas", proteksi, postKelas);
router.delete("/deletekelassiswa/:id_siswa", proteksi, deleteKelasSiswa);
router.get("/siswakelas/:tahun?/:id_kelas?", proteksi, siswaKelas);

router.get(
  "/backup/:tahun",
  proteksi,
  backupJson
);

router.post(
  "/restore",
  proteksi,
  restoreJson
);





module.exports = router;