const { MataPelajaran, MapelKelas } = require("../models");
const { Op } = require("sequelize");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

const isAdmin = (req) => {
  const role = String(req.user?.role || req.user?.nama_role || "").toLowerCase();
  return role === "admin";
};

const daftarMapel = async (req, res) => {
  try {
    const data = await MataPelajaran.findAll({ order: [["nama_pelajaran", "ASC"]] });

    return res.status(200).json({
      status: "success",
      message: "Daftar mata pelajaran berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar mata pelajaran.",
      error: error.message,
    });
  }
};

const createMapel = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ status: "error", message: "Akses ditolak. Hanya admin." });
  }

  const nama_pelajaran = String(req.body?.nama_pelajaran || "").trim();

  if (!nama_pelajaran) {
    return res.status(400).json({
      status: "error",
      message: "Nama mata pelajaran wajib diisi.",
    });
  }

  try {
    const existing = await MataPelajaran.findOne({ where: { nama_pelajaran } });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: `Mata pelajaran ${nama_pelajaran} sudah ada.`,
      });
    }

    const data = await MataPelajaran.create({ nama_pelajaran });

    catatLogAktivitas(req, {
      modul: "mapel",
      aksi: "create",
      keterangan: `Menambahkan mata pelajaran ${nama_pelajaran}`,
      data_sebelum: null,
      data_sesudah: data.toJSON(),
    });

    return res.status(201).json({
      status: "success",
      message: "Mata pelajaran berhasil ditambahkan.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menambahkan mata pelajaran.",
      error: error.message,
    });
  }
};

const updateMapel = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ status: "error", message: "Akses ditolak. Hanya admin." });
  }

  const { id_mapel } = req.params;
  const nama_pelajaran = String(req.body?.nama_pelajaran || "").trim();

  if (!nama_pelajaran) {
    return res.status(400).json({
      status: "error",
      message: "Nama mata pelajaran wajib diisi.",
    });
  }

  try {
    const row = await MataPelajaran.findByPk(id_mapel);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Mata pelajaran tidak ditemukan." });
    }

    const existing = await MataPelajaran.findOne({
      where: { nama_pelajaran, id_mapel: { [Op.ne]: id_mapel } },
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: `Mata pelajaran ${nama_pelajaran} sudah ada.`,
      });
    }

    const dataSebelum = row.toJSON();
    await row.update({ nama_pelajaran });

    catatLogAktivitas(req, {
      modul: "mapel",
      aksi: "update",
      keterangan: `Mengubah mata pelajaran ${dataSebelum.nama_pelajaran} menjadi ${nama_pelajaran}`,
      data_sebelum: dataSebelum,
      data_sesudah: row.toJSON(),
    });

    return res.status(200).json({
      status: "success",
      message: "Mata pelajaran berhasil diubah.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengubah mata pelajaran.",
      error: error.message,
    });
  }
};

const hapusMapel = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ status: "error", message: "Akses ditolak. Hanya admin." });
  }

  const { id_mapel } = req.params;

  try {
    const row = await MataPelajaran.findByPk(id_mapel);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Mata pelajaran tidak ditemukan." });
    }

    const jumlahDipakai = await MapelKelas.count({ where: { id_mapel } });

    if (jumlahDipakai > 0) {
      return res.status(400).json({
        status: "error",
        message: `Tidak bisa dihapus, masih dipakai di ${jumlahDipakai} jadwal kelas.`,
      });
    }

    const namaSebelum = row.nama_pelajaran;
    await row.destroy();

    catatLogAktivitas(req, {
      modul: "mapel",
      aksi: "delete",
      keterangan: `Menghapus mata pelajaran ${namaSebelum}`,
      data_sebelum: { id_mapel, nama_pelajaran: namaSebelum },
      data_sesudah: null,
    });

    return res.status(200).json({
      status: "success",
      message: "Mata pelajaran berhasil dihapus.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus mata pelajaran.",
      error: error.message,
    });
  }
};

module.exports = {
  daftarMapel,
  createMapel,
  updateMapel,
  hapusMapel,
};
