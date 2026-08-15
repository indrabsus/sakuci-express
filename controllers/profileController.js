const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { DataUser, SiswaPpdb } = require("../models");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "profil");
const PUBLIC_PREFIX = "/uploads/profil/";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Hapus file foto lama dari disk kalau memang upload-an sendiri (bukan URL
// eksternal atau null) - dibungkus try/catch supaya kegagalan hapus (mis.
// file sudah tidak ada) tidak menggagalkan upload foto baru.
const hapusFotoLama = (gambarLama) => {
  if (!gambarLama || !gambarLama.startsWith(PUBLIC_PREFIX)) return;

  const namaFile = path.basename(gambarLama);
  const fullPath = path.join(UPLOAD_DIR, namaFile);

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Gagal menghapus foto lama:", err.message);
    }
  });
};

const uploadFotoProfil = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Foto wajib diupload.",
      });
    }

    const isSiswa = String(req.user?.role || req.user?.nama_role || "").toLowerCase() === "siswa";

    let akun;
    let idData = req.user?.id_data;

    if (isSiswa) {
      akun = await SiswaPpdb.findOne({ where: { id_siswa: req.user.userId } });
    } else if (idData) {
      akun = await DataUser.findOne({ where: { id_data: idData } });
    } else {
      // Akun staf lama yang belum punya baris DataUser (mis. akun admin
      // bawaan) - buatkan seadanya biar tetap bisa punya foto profil.
      akun = await DataUser.create({
        id_user: req.user.userId,
        nama_lengkap: req.user.username,
        nama_singkat: req.user.username,
        jenkel: "l",
      });
      idData = akun.id_data;
    }

    if (!akun) {
      return res.status(404).json({
        status: "error",
        message: "Akun tidak ditemukan.",
      });
    }

    const namaFile = `${crypto.randomUUID()}.jpg`;
    const tujuanPath = path.join(UPLOAD_DIR, namaFile);

    // Kompres + resize ke maksimal 512x512 (tetap proporsional, tidak
    // di-crop paksa), dikonversi ke JPEG kualitas 80 - foto HP beberapa MB
    // biasanya jadi <100KB, cukup buat avatar.
    await sharp(req.file.buffer)
      .rotate()
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(tujuanPath);

    const gambarBaru = `${PUBLIC_PREFIX}${namaFile}`;
    const gambarLama = akun.gambar;

    await akun.update({ gambar: gambarBaru });
    hapusFotoLama(gambarLama);

    return res.status(200).json({
      status: "success",
      message: "Foto profil berhasil diperbarui.",
      data: { gambar: gambarBaru },
    });
  } catch (error) {
    console.error("Error uploadFotoProfil:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengupload foto profil.",
      error: error.message,
    });
  }
};

module.exports = { uploadFotoProfil };
