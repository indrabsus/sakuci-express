const { PembagianMengajar, MataPelajaran, TahunAjaran, MateriAjar, Tugas } = require("../models");
const { getTahunAjaranAktifNama, getIdTahunAjaran } = require("../utils/tahunAjaran");

const daftarMengajar = async (req, res) => {
  try {
    const rows = await PembagianMengajar.findAll({
      where: { id_user: req.user.userId },
      include: [
        { model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] },
        { model: TahunAjaran, as: "tahun_ajaran", attributes: ["nama"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar pembagian mengajar berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar pembagian mengajar.",
      error: error.message,
    });
  }
};

const buatMengajar = async (req, res) => {
  try {
    const idMapel = String(req.body?.id_mapel || "");
    const tingkat = String(req.body?.tingkat || "").trim();
    const namaKelas = String(req.body?.nama_kelas || "").trim();
    const namaTahunAjaran = String(req.body?.tahun_ajaran || "").trim();

    if (!idMapel || !tingkat || !namaKelas) {
      return res.status(400).json({
        status: "error",
        message: "Mata pelajaran, tingkat, dan kelas wajib dipilih.",
      });
    }

    const namaTahun = namaTahunAjaran || (await getTahunAjaranAktifNama());
    const idTahunAjaran = await getIdTahunAjaran(namaTahun);

    if (!idTahunAjaran) {
      return res.status(400).json({ status: "error", message: "Tahun ajaran tidak ditemukan." });
    }

    const existing = await PembagianMengajar.findOne({
      where: { id_user: req.user.userId, id_mapel: idMapel, id_tahun_ajaran: idTahunAjaran, tingkat, nama_kelas: namaKelas },
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "Anda sudah terdaftar mengajar mapel ini di kelas tersebut pada tahun ajaran ini.",
      });
    }

    const row = await PembagianMengajar.create({
      id_user: req.user.userId,
      id_mapel: idMapel,
      id_tahun_ajaran: idTahunAjaran,
      tingkat,
      nama_kelas: namaKelas,
    });

    return res.status(201).json({
      status: "success",
      message: "Pembagian mengajar berhasil ditambahkan.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menambahkan pembagian mengajar.",
      error: error.message,
    });
  }
};

const hapusMengajar = async (req, res) => {
  try {
    const row = await PembagianMengajar.findOne({
      where: { id_pengajaran: req.params.id, id_user: req.user.userId },
    });

    if (!row) {
      return res.status(404).json({ status: "error", message: "Data pembagian mengajar tidak ditemukan." });
    }

    const [jumlahMateri, jumlahTugas] = await Promise.all([
      MateriAjar.count({ where: { id_pengajaran: row.id_pengajaran } }),
      Tugas.count({ where: { id_pengajaran: row.id_pengajaran } }),
    ]);

    if (jumlahMateri > 0 || jumlahTugas > 0) {
      return res.status(400).json({
        status: "error",
        message: `Tidak bisa dihapus, sudah ada ${jumlahMateri} materi dan ${jumlahTugas} tugas terkait.`,
      });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Pembagian mengajar berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus pembagian mengajar.",
      error: error.message,
    });
  }
};

module.exports = { daftarMengajar, buatMengajar, hapusMengajar };
