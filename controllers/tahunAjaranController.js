const { TahunAjaran, RiwayatKelas } = require("../models");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

const isAdmin = (req) => {
  const role = String(req.user?.role || req.user?.nama_role || "").toLowerCase();
  return role === "admin";
};

const daftarTahunAjaran = async (req, res) => {
  try {
    const rows = await TahunAjaran.findAll({ order: [["nama", "DESC"]] });

    return res.status(200).json({
      status: "success",
      message: "Daftar tahun ajaran berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar tahun ajaran.",
      error: error.message,
    });
  }
};

const createTahunAjaran = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Hanya admin.",
    });
  }

  const nama = String(req.body?.nama || "").trim();

  if (!/^\d{4}\/\d{4}$/.test(nama)) {
    return res.status(400).json({
      status: "error",
      message: 'Format tahun ajaran harus "YYYY/YYYY", mis. 2026/2027.',
    });
  }

  try {
    const existing = await TahunAjaran.findOne({ where: { nama } });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: `Tahun ajaran ${nama} sudah ada.`,
      });
    }

    const data = await TahunAjaran.create({ nama });

    catatLogAktivitas(req, {
      modul: "tahun_ajaran",
      aksi: "create",
      keterangan: `Menambahkan tahun ajaran ${nama}`,
      data_sebelum: null,
      data_sesudah: data.toJSON(),
    });

    return res.status(201).json({
      status: "success",
      message: "Tahun ajaran berhasil ditambahkan.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menambahkan tahun ajaran.",
      error: error.message,
    });
  }
};

const aktifkanTahunAjaran = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Hanya admin.",
    });
  }

  const { id_tahun_ajaran } = req.params;

  try {
    const row = await TahunAjaran.findByPk(id_tahun_ajaran);

    if (!row) {
      return res.status(404).json({
        status: "error",
        message: "Tahun ajaran tidak ditemukan.",
      });
    }

    if (row.is_aktif) {
      return res.status(200).json({
        status: "success",
        message: `Tahun ajaran ${row.nama} sudah aktif.`,
      });
    }

    // Cuma boleh satu tahun ajaran aktif dalam satu waktu - matikan yang lama
    // dulu sebelum menyalakan yang baru, dibungkus transaksi biar konsisten.
    await TahunAjaran.sequelize.transaction(async (t) => {
      await TahunAjaran.update(
        { is_aktif: false },
        { where: { is_aktif: true }, transaction: t }
      );
      await row.update({ is_aktif: true }, { transaction: t });
    });

    catatLogAktivitas(req, {
      modul: "tahun_ajaran",
      aksi: "update",
      keterangan: `Mengaktifkan tahun ajaran ${row.nama}`,
      data_sebelum: null,
      data_sesudah: { id_tahun_ajaran, nama: row.nama, is_aktif: true },
    });

    return res.status(200).json({
      status: "success",
      message: `Tahun ajaran ${row.nama} berhasil diaktifkan.`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengaktifkan tahun ajaran.",
      error: error.message,
    });
  }
};

const hapusTahunAjaran = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Hanya admin.",
    });
  }

  const { id_tahun_ajaran } = req.params;

  try {
    const row = await TahunAjaran.findByPk(id_tahun_ajaran);

    if (!row) {
      return res.status(404).json({
        status: "error",
        message: "Tahun ajaran tidak ditemukan.",
      });
    }

    if (row.is_aktif) {
      return res.status(400).json({
        status: "error",
        message: "Tidak bisa menghapus tahun ajaran yang sedang aktif.",
      });
    }

    const jumlahRiwayat = await RiwayatKelas.count({ where: { id_tahun_ajaran } });

    if (jumlahRiwayat > 0) {
      return res.status(400).json({
        status: "error",
        message: `Tidak bisa dihapus, masih dipakai oleh ${jumlahRiwayat} data riwayat kelas.`,
      });
    }

    const namaSebelum = row.nama;
    await row.destroy();

    catatLogAktivitas(req, {
      modul: "tahun_ajaran",
      aksi: "delete",
      keterangan: `Menghapus tahun ajaran ${namaSebelum}`,
      data_sebelum: { id_tahun_ajaran, nama: namaSebelum },
      data_sesudah: null,
    });

    return res.status(200).json({
      status: "success",
      message: "Tahun ajaran berhasil dihapus.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus tahun ajaran.",
      error: error.message,
    });
  }
};

module.exports = {
  daftarTahunAjaran,
  createTahunAjaran,
  aktifkanTahunAjaran,
  hapusTahunAjaran,
};
