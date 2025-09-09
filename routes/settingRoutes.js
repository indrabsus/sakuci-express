const express = require("express");
const { upload, uploadFile, deleteFile } = require("../controllers/profileController");
const proteksi = require('../middleware/authMiddleware');
const router = express.Router();

// Upload foto
router.post("/upload", proteksi, upload.single("file"), uploadFile);

// Hapus foto
router.post("/delete", proteksi, deleteFile);

module.exports = router;