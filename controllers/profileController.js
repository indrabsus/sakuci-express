const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { DataUser, SiswaPpdb } = require("../models");

// ===== MULTER STORAGE =====
const crypto = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(6).toString("hex");
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 },
});

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    const { userId, id_role } = req.body;
    const filePath = `/uploads/${req.file.filename}`;

    let oldData;

    if (parseInt(id_role) === 8) {
      oldData = await SiswaPpdb.findOne({ where: { id_siswa: userId } });
      if (oldData && oldData.gambar) {
        const oldPath = path.join(__dirname, "..", oldData.gambar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // hapus file lama
        }
      }
      await SiswaPpdb.update({ gambar: filePath }, { where: { id_siswa: userId } });
    } else {
      oldData = await DataUser.findOne({ where: { id_user: userId } });
      if (oldData && oldData.gambar) {
        const oldPath = path.join(__dirname, "..", oldData.gambar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      await DataUser.update({ gambar: filePath }, { where: { id_user: userId } });
    }

    return res.json({
      status: "success",
      file: {
        filename: req.file.filename,
        path: filePath,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// controllers/profileController.js
const deleteFile = async (req, res) => {
  try {
    const { userId, id_role } = req.body;

    let oldData, updated;

    if (parseInt(id_role) === 8) {
      oldData = await SiswaPpdb.findOne({ where: { id_siswa: userId } });

      if (oldData && oldData.gambar) {
        const oldPath = path.join(__dirname, "..", oldData.gambar.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      [updated] = await SiswaPpdb.update(
        { gambar: null },
        { where: { id_siswa: userId } }
      );
    } else {
      oldData = await DataUser.findOne({ where: { id_user: userId } });

      if (oldData && oldData.gambar) {
        const oldPath = path.join(__dirname, "..", oldData.gambar.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      [updated] = await DataUser.update(
        { gambar: null },
        { where: { id_user: userId } }
      );
    }

    if (!updated) {
      return res.status(400).json({ status: "error", message: "Data not found or not updated" });
    }

    return res.json({ status: "success", message: "File deleted and DB updated" });

  } catch (err) {
    console.error("Delete file error:", err);
    return res.status(500).json({ status: "error", message: err.message || "Server error" });
  }
};

module.exports = { upload, uploadFile, deleteFile };