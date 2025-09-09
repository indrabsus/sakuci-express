const { MasterSpp, LogSpp } = require("../models"); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where } = require("sequelize");
const { axios, axiosInstance } = require("../config/axios");

const masterSppData = async (req, res) => {
  const { tahun } = req.params;

  // Jika tahun tidak ada, ambil semua data
  const whereClause = tahun ? { tahun } : {};

  try {
    const data = await MasterSpp.findOne({
      where: whereClause,
    });

    return res.status(200).json({
      status: "success",
      message: `Data berhasil diambil${tahun ? ` untuk tahun ${tahun}` : ""}.`,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data.",
      error: error.message,
    });
  }
};

const logLastSpp = async (req, res) => {
  try {
    const { id_siswa } = req.params;

    const data = await LogSpp.findAll({
      where: { id_siswa },
      order: [["created_at", "DESC"]], // urutkan dari terbaru
      limit: 3, // ambil hanya 3 data
    });

    return res.status(200).json({
      status: "success",
      message: "Data berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan",
      error: error.message,
    });
  }
};


const bayarSpp = async (req, res) => {
  try {
    const { id_siswa, nominal, bayar, bulan, kelas, status } = req.body;

    // kalau ada file (bukti upload)
    let buktiPath = null;
    if (req.file) {
      buktiPath = "/uploads/bukti/" + req.file.filename;
    }

    const newSpp = await LogSpp.create({
      id_siswa,
      nominal,
      bayar,
      bulan,
      kelas,
      status,
      bukti: buktiPath,
    });

    return res.status(201).json({
      success: true,
      message: "SPP berhasil disimpan",
      data: newSpp,
    });
  } catch (error) {
    console.error("Error bayar SPP:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

module.exports = {
  masterSppData,
  logLastSpp,
  bayarSpp
};