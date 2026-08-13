const { InformasiSekolah } = require("../models");
const catatLogAktivitas = require("../utils/catatLogAktivitas");

const isAdmin = (req) => {
  const role = String(req.user?.role || req.user?.nama_role || "").toLowerCase();
  return role === "admin";
};

const getInformasiSekolah = async (req, res) => {
  try {
    const data = await InformasiSekolah.findOne({ order: [["created_at", "ASC"]] });

    return res.status(200).json({
      status: "success",
      message: "Informasi sekolah berhasil diambil.",
      data: data || null,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil informasi sekolah.",
      error: error.message,
    });
  }
};

const updateInformasiSekolah = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ status: "error", message: "Akses ditolak. Hanya admin." });
  }

  const nama_sekolah = String(req.body?.nama_sekolah || "").trim();

  if (!nama_sekolah) {
    return res.status(400).json({
      status: "error",
      message: "Nama sekolah wajib diisi.",
    });
  }

  const payload = {
    nama_sekolah,
    alamat: String(req.body?.alamat || "").trim() || null,
    email: String(req.body?.email || "").trim() || null,
    instagram: String(req.body?.instagram || "").trim() || null,
    no_telepon: String(req.body?.no_telepon || "").trim() || null,
    nama_kepala_sekolah: String(req.body?.nama_kepala_sekolah || "").trim() || null,
    nip_kepala_sekolah: String(req.body?.nip_kepala_sekolah || "").trim() || null,
    visi: String(req.body?.visi || "").trim() || null,
    misi: String(req.body?.misi || "").trim() || null,
  };

  try {
    let row = await InformasiSekolah.findOne({ order: [["created_at", "ASC"]] });
    const dataSebelum = row ? row.toJSON() : null;

    if (row) {
      await row.update(payload);
    } else {
      row = await InformasiSekolah.create(payload);
    }

    catatLogAktivitas(req, {
      modul: "informasi_sekolah",
      aksi: dataSebelum ? "update" : "create",
      keterangan: "Memperbarui informasi sekolah",
      data_sebelum: dataSebelum,
      data_sesudah: row.toJSON(),
    });

    return res.status(200).json({
      status: "success",
      message: "Informasi sekolah berhasil disimpan.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal menyimpan informasi sekolah.",
      error: error.message,
    });
  }
};

module.exports = {
  getInformasiSekolah,
  updateInformasiSekolah,
};
