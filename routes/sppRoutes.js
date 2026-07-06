const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const {
  masterSppData,
  logLastSpp,
  bayarSpp,
  logSpp,
  detailLog,
  updateLog,
  deleteLog,
  createMaster,
  updateMaster,
  detailMaster,
  deleteMaster,
  logLainnya,
  updateLoglainnya,
  deleteLogLainnya,
  createLogLainnya,
  laporan,
  dataSiswa,
  logPpdb,
  deleteLogPpdb,
  
   arsipSummary,
  backupArsipMaster,
  backupArsipSiswa,
  backupArsipLogSpp,
  backupArsipLogPpdb,
  hapusArsipAngkatan,
  arsipTahunAjaranSummary,
  backupArsipTahunAjaran,
  restoreArsipTahunAjaran,
} = require("../controllers/sppController");

const router = express.Router();

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads/bukti/");
ensureDir("uploads/backup/");

const storageBukti = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/bukti/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const uniqueName =
      crypto.randomBytes(16).toString("hex") + "-" + Date.now() + ext;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storageBukti,
});

const storageBackup = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/backup/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".json";

    const uniqueName =
      "restore-spp-" +
      crypto.randomBytes(10).toString("hex") +
      "-" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});

const uploadBackup = multer({
  storage: storageBackup,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== ".json") {
      return cb(new Error("File restore harus berformat .json"));
    }

    cb(null, true);
  },
});

const handleUploadBackup = (req, res, next) => {
  uploadBackup.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        status: "gagal",
        message: error.message || "Gagal upload file backup.",
      });
    }

    next();
  });
};

// MASTER SPP
router.get("/master/:tahun?", masterSppData);
router.get("/detailmaster/:id_spp?", proteksi, detailMaster);
router.post("/createmaster", proteksi, createMaster);
router.put("/updatemaster/:id_spp", proteksi, updateMaster);
router.delete("/deletemaster/:id_spp", proteksi, deleteMaster);

// LOG SPP
router.get("/loglast/:id_siswa", proteksi, logLastSpp);
router.get("/log", logSpp);
router.get("/logdetail/:id_logspp", proteksi, detailLog);
router.put("/updatelog/:id_logspp", proteksi, updateLog);
router.delete("/deletelog/:id_logspp", proteksi, deleteLog);

// LOG PPDB
router.get("/logppdb", logPpdb);
router.delete("/deletelogppdb/:id_log", proteksi, deleteLogPpdb);

// LOG LAINNYA
router.get("/loglainnya/:id_logluar?", logLainnya);
router.post("/createloglainnya", createLogLainnya);
router.put("/updateloglainnya/:id_logluar", updateLoglainnya);
router.delete("/deleteloglainnya/:id_logluar", deleteLogLainnya);

// LAPORAN
router.get("/laporan", laporan);

// DATA SISWA
router.get("/siswa", dataSiswa);

// BAYAR SPP
router.post("/bayar", upload.single("bukti"), bayarSpp);

router.get("/arsip/summary/:tahun", proteksi, arsipSummary);
router.get("/arsip/backup-master", proteksi, backupArsipMaster);
router.get("/arsip/backup-siswa/:tahun", proteksi, backupArsipSiswa);
router.get("/arsip/backup-log-spp/:tahun", proteksi, backupArsipLogSpp);
router.get("/arsip/backup-log-ppdb/:tahun", proteksi, backupArsipLogPpdb);
router.delete("/arsip/hapus-angkatan/:tahun", proteksi, hapusArsipAngkatan);

router.get("/arsip/summary-ta", proteksi, arsipTahunAjaranSummary);
router.get("/arsip/backup-ta", proteksi, backupArsipTahunAjaran);
router.post("/arsip/restore-ta", proteksi, restoreArsipTahunAjaran);




module.exports = router;