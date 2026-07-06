const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const proteksi = require("../middleware/authMiddleware");

const {
  backupDatabase,
  restoreDatabase,
  listBackup,
  downloadBackup,
  deleteBackup,
} = require("../controllers/backupController");

const router = express.Router();

const restoreDir = path.join(__dirname, "..", "uploads", "backup", "restore-tmp");

if (!fs.existsSync(restoreDir)) {
  fs.mkdirSync(restoreDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, restoreDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      "restore-db-" + crypto.randomBytes(10).toString("hex") + "-" + Date.now() + ".sql";

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext !== ".sql") {
      return cb(new Error("File restore harus berformat .sql"));
    }

    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.message || "Gagal upload file backup.",
      });
    }

    next();
  });
};

router.get("/database", proteksi, backupDatabase);
router.get("/database/list", proteksi, listBackup);
router.get("/database/download/:filename", proteksi, downloadBackup);
router.delete("/database/:filename", proteksi, deleteBackup);
router.post("/database/restore", proteksi, handleUpload, restoreDatabase);

module.exports = router;
