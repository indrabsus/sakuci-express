const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { BankSoal, OpsiJawaban, MataPelajaran, DataUser, TugasSoal, PembagianMengajar } = require("../models");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "soal");
const PUBLIC_PREFIX = "/uploads/soal/";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const hapusGambarLama = (url) => {
  if (!url || !url.startsWith(PUBLIC_PREFIX)) return;

  const namaFile = path.basename(url);
  const fullPath = path.join(UPLOAD_DIR, namaFile);

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Gagal menghapus gambar soal lama:", err.message);
    }
  });
};

const uploadGambarSoal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Gambar wajib diupload." });
    }

    const namaFile = `${crypto.randomUUID()}.jpg`;
    const tujuanPath = path.join(UPLOAD_DIR, namaFile);

    await sharp(req.file.buffer)
      .rotate()
      .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(tujuanPath);

    return res.status(200).json({
      status: "success",
      message: "Gambar berhasil diupload.",
      data: { url: `${PUBLIC_PREFIX}${namaFile}` },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengupload gambar.", error: error.message });
  }
};

async function ambilSoalMilikGuru(req, idSoal) {
  const row = await BankSoal.findOne({ where: { id_soal: idSoal, dibuat_oleh: req.user.userId } });
  return row;
}

async function mapelDiajarGuru(req, idMapel) {
  if (!idMapel) return true;
  const row = await PembagianMengajar.findOne({ where: { id_user: req.user.userId, id_mapel: idMapel } });
  return !!row;
}

const daftarSoal = async (req, res) => {
  try {
    const where = { dibuat_oleh: req.user.userId };
    if (req.query.id_mapel) where.id_mapel = req.query.id_mapel;

    const rows = await BankSoal.findAll({
      where,
      include: [
        { model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] },
        { model: OpsiJawaban, as: "opsi", attributes: ["id_opsi", "label", "isi_opsi", "gambar_url", "kategori", "is_benar"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ status: "success", message: "Daftar bank soal berhasil diambil.", data: rows });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar bank soal.", error: error.message });
  }
};

function validasiOpsi(tipeSoal, opsi, daftarKategori) {
  if (tipeSoal === "essay") return null;

  if (!Array.isArray(opsi) || opsi.length < 2) {
    return "Soal pilihan ganda butuh minimal 2 opsi jawaban.";
  }
  if (opsi.some((o) => !String(o.isi_opsi || "").trim() && !String(o.gambar_url || "").trim())) {
    return "Setiap opsi jawaban wajib diisi teks atau gambar.";
  }

  if (tipeSoal === "pg_tunggal") {
    const jumlahBenar = opsi.filter((o) => o.is_benar).length;
    if (jumlahBenar !== 1) return "Pilihan ganda sederhana harus punya tepat satu jawaban benar.";
    return null;
  }

  if (tipeSoal === "pg_mcma") {
    const jumlahBenar = opsi.filter((o) => o.is_benar).length;
    if (jumlahBenar < 2) return "Pilihan ganda MCMA butuh minimal dua jawaban benar.";
    return null;
  }

  if (tipeSoal === "pg_kategori") {
    const kategoriList = Array.isArray(daftarKategori) ? daftarKategori.map((k) => String(k).trim()).filter(Boolean) : [];
    if (kategoriList.length < 2) return "Pilihan ganda kategori butuh minimal dua kategori.";
    const kategoriSet = new Set(kategoriList);
    if (opsi.some((o) => !kategoriSet.has(String(o.kategori || "").trim()))) {
      return "Setiap opsi harus ditempatkan ke salah satu kategori yang sudah dibuat.";
    }
    return null;
  }

  return "Tipe soal tidak valid.";
}

const buatSoal = async (req, res) => {
  try {
    const idMapel = String(req.body?.id_mapel || "").trim() || null;
    const tipeSoal = String(req.body?.tipe_soal || "pg_tunggal");
    const pertanyaan = String(req.body?.pertanyaan || "").trim();
    const gambarUrl = String(req.body?.gambar_url || "").trim() || null;
    const tingkatKesulitan = String(req.body?.tingkat_kesulitan || "sedang");
    const pembahasan = String(req.body?.pembahasan || "").trim() || null;
    const opsi = Array.isArray(req.body?.opsi) ? req.body.opsi : [];
    const daftarKategori = Array.isArray(req.body?.daftar_kategori) ? req.body.daftar_kategori : [];

    if (!pertanyaan || !["pg_tunggal", "pg_mcma", "pg_kategori", "essay"].includes(tipeSoal)) {
      return res.status(400).json({ status: "error", message: "Pertanyaan dan tipe soal wajib diisi." });
    }

    if (!(await mapelDiajarGuru(req, idMapel))) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar mata pelajaran ini." });
    }

    const errorOpsi = validasiOpsi(tipeSoal, opsi, daftarKategori);
    if (errorOpsi) {
      return res.status(400).json({ status: "error", message: errorOpsi });
    }

    const dataUser = await DataUser.findByPk(req.user.id_data);
    const kategoriCsv = tipeSoal === "pg_kategori" ? daftarKategori.map((k) => String(k).trim()).join(",") : null;

    const soal = await BankSoal.create({
      id_mapel: idMapel,
      tipe_soal: tipeSoal,
      daftar_kategori: kategoriCsv,
      pertanyaan,
      gambar_url: gambarUrl,
      tingkat_kesulitan: tingkatKesulitan,
      pembahasan,
      dibuat_oleh: req.user.userId,
      nama_pembuat: dataUser?.nama_lengkap || req.user.username,
    });

    if (tipeSoal !== "essay") {
      await OpsiJawaban.bulkCreate(
        opsi.map((o) => ({
          id_soal: soal.id_soal,
          label: String(o.label || "").trim(),
          isi_opsi: String(o.isi_opsi || "").trim(),
          gambar_url: String(o.gambar_url || "").trim() || null,
          kategori: tipeSoal === "pg_kategori" ? String(o.kategori || "").trim() : null,
          is_benar: tipeSoal === "pg_kategori" ? false : !!o.is_benar,
        }))
      );
    }

    return res.status(201).json({ status: "success", message: "Soal berhasil ditambahkan.", data: soal });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menambahkan soal.", error: error.message });
  }
};

const updateSoal = async (req, res) => {
  try {
    const row = await ambilSoalMilikGuru(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Soal tidak ditemukan." });
    }

    const idMapel = String(req.body?.id_mapel || "").trim() || null;
    const tipeSoal = String(req.body?.tipe_soal || "pg_tunggal");
    const pertanyaan = String(req.body?.pertanyaan || "").trim();
    const gambarUrl = String(req.body?.gambar_url || "").trim() || null;
    const tingkatKesulitan = String(req.body?.tingkat_kesulitan || "sedang");
    const pembahasan = String(req.body?.pembahasan || "").trim() || null;
    const opsi = Array.isArray(req.body?.opsi) ? req.body.opsi : [];
    const daftarKategori = Array.isArray(req.body?.daftar_kategori) ? req.body.daftar_kategori : [];

    if (!pertanyaan || !["pg_tunggal", "pg_mcma", "pg_kategori", "essay"].includes(tipeSoal)) {
      return res.status(400).json({ status: "error", message: "Pertanyaan dan tipe soal wajib diisi." });
    }

    if (!(await mapelDiajarGuru(req, idMapel))) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar mata pelajaran ini." });
    }

    const errorOpsi = validasiOpsi(tipeSoal, opsi, daftarKategori);
    if (errorOpsi) {
      return res.status(400).json({ status: "error", message: errorOpsi });
    }

    const opsiLama = await OpsiJawaban.findAll({ where: { id_soal: row.id_soal } });
    const gambarSoalLama = row.gambar_url;
    const kategoriCsv = tipeSoal === "pg_kategori" ? daftarKategori.map((k) => String(k).trim()).join(",") : null;

    await row.update({
      id_mapel: idMapel,
      tipe_soal: tipeSoal,
      daftar_kategori: kategoriCsv,
      pertanyaan,
      gambar_url: gambarUrl,
      tingkat_kesulitan: tingkatKesulitan,
      pembahasan,
    });

    await OpsiJawaban.destroy({ where: { id_soal: row.id_soal } });

    if (tipeSoal !== "essay") {
      await OpsiJawaban.bulkCreate(
        opsi.map((o) => ({
          id_soal: row.id_soal,
          label: String(o.label || "").trim(),
          isi_opsi: String(o.isi_opsi || "").trim(),
          gambar_url: String(o.gambar_url || "").trim() || null,
          kategori: tipeSoal === "pg_kategori" ? String(o.kategori || "").trim() : null,
          is_benar: tipeSoal === "pg_kategori" ? false : !!o.is_benar,
        }))
      );
    }

    // Bersihkan file gambar lama yang sudah tidak dipakai lagi (soal diganti
    // gambar baru, atau opsi dengan gambar tertentu dihapus/diganti).
    if (gambarSoalLama && gambarSoalLama !== gambarUrl) hapusGambarLama(gambarSoalLama);
    const gambarOpsiBaruSet = new Set(opsi.map((o) => o.gambar_url).filter(Boolean));
    opsiLama.forEach((o) => {
      if (o.gambar_url && !gambarOpsiBaruSet.has(o.gambar_url)) hapusGambarLama(o.gambar_url);
    });

    return res.status(200).json({ status: "success", message: "Soal berhasil diubah.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengubah soal.", error: error.message });
  }
};

const hapusSoal = async (req, res) => {
  try {
    const row = await ambilSoalMilikGuru(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Soal tidak ditemukan." });
    }

    const jumlahDipakai = await TugasSoal.count({ where: { id_soal: row.id_soal } });

    if (jumlahDipakai > 0) {
      return res.status(400).json({
        status: "error",
        message: `Tidak bisa dihapus, soal ini masih dipakai di ${jumlahDipakai} tugas.`,
      });
    }

    const opsiList = await OpsiJawaban.findAll({ where: { id_soal: row.id_soal } });

    await OpsiJawaban.destroy({ where: { id_soal: row.id_soal } });
    await row.destroy();

    hapusGambarLama(row.gambar_url);
    opsiList.forEach((o) => hapusGambarLama(o.gambar_url));

    return res.status(200).json({ status: "success", message: "Soal berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus soal.", error: error.message });
  }
};

module.exports = { daftarSoal, buatSoal, updateSoal, hapusSoal, uploadGambarSoal };
