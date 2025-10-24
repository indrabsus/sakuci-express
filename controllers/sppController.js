const { JsMasterSpp, LogSpp, SiswaPpdb, SiswaBaru, KelasPpdb } = require("../models"); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where } = require("sequelize");
const { axios, axiosInstance } = require("../config/axios");
const fs = require("fs");
const path = require("path");

const masterSppData = async (req, res) => {
  const { tahun } = req.params; // atau req.query, tergantung rute

  try {
    const whereClause = tahun ? { tahun } : {};

    const data = tahun
      ? await JsMasterSpp.findOne({ where: whereClause }) // hanya 1 tahun
      : await JsMasterSpp.findAll({ where: whereClause }); // semua data

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

const detailMaster = async (req, res) => {
  const { id_spp } = req.params; // atau req.query, tergantung rute

  try {

    const data = await JsMasterSpp.findOne({ where: {id_spp} }) // hanya 1 tahun

    return res.status(200).json({
      status: "success",
      message: "Data berhasil diambil",
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

const createMaster= async(req, res) => {
    const { tahun, spp10, spp11, spp12, daftar_ulang_11, daftar_ulang_12, pkl, ujian_akhir } = req.body;
    try{
        const data = await JsMasterSpp.create({
            tahun, spp10, spp11, spp12, daftar_ulang_11, daftar_ulang_12, pkl, ujian_akhir
        })
        if(!data){
            res.status(400).json({
                status: 'error',
                message: 'gagal menambahkan data!'
            })
        } else {
            res.status(200).json({
                status: 'success',
                message: 'berhasil menambahkan data!',
                data
            })
        }
    } catch(error){
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengambil data!',
            error: error.message
        })
    }
}
const updateMaster = async (req, res) => {
    const { id_spp } = req.params; // ambil id dari URL
    const { tahun, spp10, spp11, spp12, daftar_ulang_11, daftar_ulang_12, pkl, ujian_akhir } = req.body;

    try {
        const data = await JsMasterSpp.findByPk(id_spp);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        // update data
        await data.update({ tahun, spp10, spp11, spp12, daftar_ulang_11, daftar_ulang_12, pkl, ujian_akhir });

        res.status(200).json({
            status: 'success',
            message: 'berhasil mengupdate data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengupdate data!',
            error: error.message
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

    // 🔎 cek hanya kalau bulan <= 12
    if (bulan <= 12) {
      const existing = await LogSpp.findOne({
        where: { id_siswa, bulan, kelas, status }
      });

      if (existing) {
        return res.status(400).json({
          status: "gagal",
          message: "SPP untuk bulan & kelas ini dengan status yang sama sudah ada!"
        });
      }
    }

    // 🚀 langsung create
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
      status: "sukses",
      message: "SPP berhasil disimpan",
      data: newSpp,
    });

  } catch (error) {
    console.error("Error bayar SPP:", error);
    return res.status(500).json({
      status: "gagal",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const logSpp = async (req, res) => {
  try {

    const data = await LogSpp.findAll({
      include: {
          model: SiswaPpdb, as: "siswa_ppdb",
          include: {
              model: SiswaBaru, as: "siswa_baru",
              include: {
                  model: KelasPpdb, as: "kelas_ppdb"
              }
          }
      },
      order: [["created_at", "DESC"]], // urutkan dari terbaru
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

const detailLog = async (req, res) => {
  const { id_logspp } = req.params;

  try {
    const data = await LogSpp.findOne({
      where: {id_logspp},
    });

    return res.status(200).json({
      status: "success",
      message: `Data berhasil diambil`,
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

const updateLog = async (req, res) => {
  try {
    const { id_logspp } = req.params;
    const updateData = req.body;

    const data = await LogSpp.findOne({ where: { id_logspp } });

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
        data: null,
      });
    }

    await data.update(updateData);

    res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
      data: data,
    });
  } catch (error) {
    console.error("Error saat update data:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal update data.",
      error: error.message,
    });
  }
};

const deleteLog = async (req, res) => {
  const { id_logspp } = req.params;

  try {
    const data = await LogSpp.findByPk(id_logspp);

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan!",
      });
    }

    // Hapus file bukti jika ada
    if (data.bukti) {
      // Hilangkan slash depan kalau ada
      const relativePath = data.bukti.startsWith("/")
        ? data.bukti.substring(1)
        : data.bukti;

      // Arahkan ke lokasi sebenarnya
      const filePath = path.join(__dirname, "..", relativePath);

      console.log("Path file yang akan dihapus:", filePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File ${filePath} berhasil dihapus`);
      } else {
        console.warn(`File ${filePath} tidak ditemukan`);
      }
    }

    // Hapus data dari database
    await data.destroy();

    res.status(200).json({
      status: "success",
      message: "Berhasil menghapus data!",
    });
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    res.status(500).json({
      status: "gagal",
      message: "Gagal menghapus data!",
      error: error.message,
    });
  }
};

const deleteMaster = async (req, res) => {
    const { id_spp } = req.params;

    try {
        const data = await JsMasterSpp.findByPk(id_spp);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        await data.destroy();

        res.status(200).json({
            status: 'success',
            message: 'berhasil menghapus data!'
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal menghapus data!',
            error: error.message
        });
    }
};

module.exports = {
  masterSppData,
  logLastSpp,
  bayarSpp, logSpp, detailLog, updateLog, deleteLog,
  createMaster, updateMaster, detailMaster, deleteMaster
};