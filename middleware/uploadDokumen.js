const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.id_user;
    const kategori = req.body.kategori;

    if (!userId) {
      return cb(new Error("id_user tidak ditemukan dalam request body"));
    }

    const folderPath = `uploads/dokumen/${userId}/${kategori}`;

    // cek folder, kalau tidak ada → buat
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const uploadDokumen = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Hanya file PDF yang diperbolehkan!"));
    }
    cb(null, true);
  },
});

module.exports = uploadDokumen;