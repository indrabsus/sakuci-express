const { RiwayatKelas, SiswaPpdb } = require("../models");
const { fn, col } = require("sequelize");

const daftarTahunAjaran = async (req, res) => {
  try {
    const rows = await RiwayatKelas.findAll({
      attributes: [[fn("DISTINCT", col("tahun_ajaran")), "tahun_ajaran"]],
      order: [["tahun_ajaran", "DESC"]],
      raw: true,
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar tahun ajaran berhasil diambil.",
      data: rows.map((row) => row.tahun_ajaran),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar tahun ajaran.",
      error: error.message,
    });
  }
};

const tahunAjaranAktif = async (req, res) => {
  try {
    const result = await RiwayatKelas.findOne({
      attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
      raw: true,
    });

    return res.status(200).json({
      status: "success",
      message: "Tahun ajaran aktif berhasil diambil.",
      data: {
        tahun_ajaran: result?.tahun_ajaran || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil tahun ajaran aktif.",
      error: error.message,
    });
  }
};

const riwayatSiswa = async (req, res) => {
  const { id_siswa } = req.params;

  try {
    const data = await RiwayatKelas.findAll({
      where: { id_siswa },
      order: [["tahun_ajaran", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Riwayat kelas berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil riwayat kelas.",
      error: error.message,
    });
  }
};

const kelasTerkini = async (req, res) => {
  const { id_siswa } = req.params;

  try {
    const data = await RiwayatKelas.findOne({
      where: { id_siswa },
      order: [["tahun_ajaran", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Kelas terkini berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil kelas terkini.",
      error: error.message,
    });
  }
};

const riwayatByTahun = async (req, res) => {
  const { tahun_ajaran } = req.query;

  if (!tahun_ajaran) {
    return res.status(400).json({
      status: "error",
      message: "Parameter tahun_ajaran wajib diisi.",
    });
  }

  try {
    const data = await RiwayatKelas.findAll({
      where: { tahun_ajaran },
      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
          attributes: ["id_siswa", "nama_lengkap", "nisn", "status"],
        },
      ],
      order: [["tingkat", "ASC"], ["nama_kelas", "ASC"]],
    });

    return res.status(200).json({
      status: "success",
      message: `Data riwayat kelas tahun ajaran ${tahun_ajaran} berhasil diambil.`,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data riwayat kelas.",
      error: error.message,
    });
  }
};

const createRiwayat = async (req, res) => {
  const { id_siswa, tahun_ajaran, tingkat, nama_kelas } = req.body;

  try {
    const existing = await RiwayatKelas.findOne({
      where: { id_siswa, tahun_ajaran },
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: `Siswa ini sudah punya data kelas untuk tahun ajaran ${tahun_ajaran}.`,
      });
    }

    const data = await RiwayatKelas.create({
      id_siswa,
      tahun_ajaran,
      tingkat,
      nama_kelas,
    });

    return res.status(200).json({
      status: "success",
      message: "Riwayat kelas berhasil ditambahkan.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menambahkan riwayat kelas.",
      error: error.message,
    });
  }
};

const naikKelas = async (req, res) => {
  const { tahun_ajaran, data } = req.body;

  if (!tahun_ajaran || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "tahun_ajaran dan data siswa wajib diisi.",
    });
  }

  const t = await RiwayatKelas.sequelize.transaction();

  try {
    const idSiswaList = data.map((item) => item.id_siswa);

    const existing = await RiwayatKelas.findAll({
      where: { tahun_ajaran, id_siswa: idSiswaList },
      transaction: t,
    });

    if (existing.length > 0) {
      await t.rollback();

      return res.status(400).json({
        status: "error",
        message: `${existing.length} siswa sudah punya data kelas untuk tahun ajaran ${tahun_ajaran}.`,
        data: existing.map((item) => item.id_siswa),
      });
    }

    const rows = data.map((item) => ({
      id_siswa: item.id_siswa,
      tahun_ajaran,
      tingkat: item.tingkat,
      nama_kelas: item.nama_kelas,
    }));

    const created = await RiwayatKelas.bulkCreate(rows, { transaction: t });

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: `Berhasil memproses kenaikan kelas untuk ${created.length} siswa.`,
      data: created,
    });
  } catch (error) {
    await t.rollback();

    return res.status(500).json({
      status: "error",
      message: "Gagal memproses kenaikan kelas.",
      error: error.message,
    });
  }
};

const deleteRiwayat = async (req, res) => {
  const { id_riwayat } = req.params;

  try {
    const deleted = await RiwayatKelas.destroy({ where: { id_riwayat } });

    if (deleted === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data riwayat kelas tidak ditemukan.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Riwayat kelas berhasil dihapus.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus riwayat kelas.",
      error: error.message,
    });
  }
};

module.exports = {
  riwayatSiswa,
  kelasTerkini,
  riwayatByTahun,
  daftarTahunAjaran,
  createRiwayat,
  naikKelas,
  deleteRiwayat,
  tahunAjaranAktif,
};
