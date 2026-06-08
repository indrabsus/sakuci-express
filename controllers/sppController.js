const { JsMasterSpp, LogSpp, SiswaPpdb, SiswaBaru, KelasPpdb, LogLuarSpp, LogPpdb, MasterPpdb } = require("../models"); // Pastikan path benar
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
    const { keyword, tingkat, page = 1, limit = 50 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const whereSiswa = {};

    if (keyword) {
      whereSiswa.nama_lengkap = {
        [Op.like]: `%${keyword}%`,
      };
    }

    const whereKelas = {};

    if (tingkat && tingkat !== "semua") {
      whereKelas.tingkat = Number(tingkat);
    }

    const pakaiFilterTingkat = Object.keys(whereKelas).length > 0;

    const { rows, count } = await LogSpp.findAndCountAll({
    attributes: [
  "id_logspp",
  "id_siswa",
  "nominal",
  "bulan",
  "kelas",
  "status",
  "bayar",
  "bukti",
  "created_at",
],

      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
          attributes: ["id_siswa", "nama_lengkap"],

          where: Object.keys(whereSiswa).length ? whereSiswa : undefined,
          required: true,

          include: [
            {
              model: SiswaBaru,
              as: "siswa_baru",
              attributes: ["id_siswa", "id_kelas"],

              required: pakaiFilterTingkat,

              include: [
                {
                  model: KelasPpdb,
                  as: "kelas_ppdb",
                  attributes: ["id_kelas", "tingkat", "nama_kelas"],

                  where: pakaiFilterTingkat ? whereKelas : undefined,
                  required: pakaiFilterTingkat,
                },
              ],
            },
          ],
        },
      ],

      order: [["created_at", "DESC"]],
      limit: limitNumber,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      status: "success",
      message: "Data berhasil diambil",
      total: count,
      page: pageNumber,
      limit: limitNumber,
      totalPage: Math.ceil(count / limitNumber),
      data: rows,
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

const logLainnya = async (req, res) => {
  try {
    const { id_logluar } = req.params;

    // Kalau ada id_logluar → ambil satu data
    if (id_logluar) {
      const data = await LogLuarSpp.findOne({
        where: { id_logluar: id_logluar },
      });

      if (!data) {
        return res.status(404).json({
          status: "error",
          message: "Data tidak ditemukan.",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Data berhasil diambil.",
        data: data,
      });
    }

    // Kalau tidak ada id → ambil semua
    const data = await LogLuarSpp.findAll({
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil.",
      data: data,
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data.",
      error: error.message,
    });
  }
};

const updateLoglainnya = async (req, res) => {
  try {
    const { id_logluar } = req.params;
    const updateData = req.body;

    const data = await LogLuarSpp.findByPk(id_logluar);

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
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

const deleteLogLainnya = async (req, res) => {
  try {
    const { id_logluar } = req.params;

    const data = await LogLuarSpp.findByPk(id_logluar);

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
      });
    }

    await data.destroy();

    res.status(200).json({
      status: "success",
      message: "Data berhasil dihapus.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal menghapus data.",
      error: error.message,
    });
  }
};

const createLogLainnya = async (req, res) => {
  try {
    const createData = req.body;
    const data = await LogLuarSpp.create(createData);
    res.status(200).json({
      status: "success",
      message: "Data berhasil disimpan.",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal menyimpan data.",
      error: error.message,
    });
  }
};

const laporan = async (req, res) => {
 try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Parameter start dan end wajib diisi. Format: YYYY-MM-DD",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end + " 23:59:59");

    // =========================
    // 🔹 SPP
    // =========================
    const sppData = await LogSpp.findAll({
      attributes: ["bayar", [fn("SUM", col("nominal")), "total"]],
      where: {
        bayar: { [Op.ne]: "sbs" },
        created_at: { [Op.between]: [startDate, endDate] },
      },
      group: ["bayar"],
    });

    let cash = 0;
    let transfer = 0;

    sppData.forEach((item) => {
      const total = parseInt(item.get("total"));
      if (item.bayar === "csh") cash = total;
      if (item.bayar === "Trf") transfer = total;
    });

    const totalSpp = cash + transfer;

    // =========================
    // 🔹 PPDB
    // =========================
    const ppdbData = await LogPpdb.findAll({
      attributes: ["jenis", [fn("SUM", col("nominal")), "total"]],
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
      },
      group: ["jenis"],
    });

    let daftar = 0;
    let ppdb = 0;
    let mengundurkan = 0;

    ppdbData.forEach((item) => {
      const total = parseInt(item.get("total"));
      if (item.jenis === "d") daftar = total;
      if (item.jenis === "p") ppdb = total;
      if (item.jenis === "l") mengundurkan = total;
    });

    const totalPpdb = daftar + ppdb + mengundurkan;

    // =========================
    // 🔹 LUAR SPP
    // =========================
    const luarData = await LogLuarSpp.findAll({
      attributes: ["status", [fn("SUM", col("nominal")), "total"]],
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
      },
      group: ["status"],
    });

    let uangMasuk = 0;
    let uangKeluar = 0;

    luarData.forEach((item) => {
      const total = parseInt(item.get("total"));
      if (item.status === "m") uangMasuk = total;
      if (item.status === "k") uangKeluar = total;
    });

    const totalLuarSpp = uangMasuk - uangKeluar;

    // =========================
    // 🔹 GRAND TOTAL AKHIR
    // =========================
    const grandTotal =
      totalSpp +
      totalPpdb +
      totalLuarSpp;

    return res.status(200).json({
      periode: {
        dari: start,
        sampai: end,
      },
      spp: {
        cash,
        transfer,
        total_spp: totalSpp,
      },
      ppdb: {
        daftar,
        ppdb,
        mengundurkan_diri: mengundurkan,
        total_ppdb: totalPpdb,
      },
      luar_spp: {
        uang_masuk: uangMasuk,
        uang_keluar: uangKeluar,
        saldo_luar_spp: totalLuarSpp,
      },
      grand_total: grandTotal,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const dataSiswa = async (req, res) => {
  const { tingkat, id_kelas, keyword } = req.query;

  try {
    const siswa = await SiswaPpdb.findAll({
      attributes: [
        "id_siswa",
        "nama_lengkap",
        "tahun",
        "status",
      ],

      where: {
        status: "aktif",

        ...(keyword && {
          nama_lengkap: {
            [Op.like]: `%${keyword}%`,
          },
        }),
      },

      include: [
        {
          model: LogPpdb,
          as: "log_ppdb",
          attributes: [
            "id_log",
            "nominal",
            "jenis",
            "bayar",
            "created_at",
          ],
          required: false,
        },

        {
          model: LogSpp,
          as: "log_spp",
         attributes: [
  "id_logspp",
  "nominal",
  "bulan",
  "kelas",
  "status",
  "bayar",
  "created_at",
],
          required: false,
        },

        {
          model: SiswaBaru,
          as: "siswa_baru",
          required: true,

          include: [
            {
              model: KelasPpdb,
              as: "kelas_ppdb",
              attributes: [
                "id_kelas",
                "tingkat",
                "nama_kelas",
              ],

              ...(tingkat || id_kelas
                ? {
                    where: {
                      ...(tingkat && { tingkat }),
                      ...(id_kelas && { id_kelas }),
                    },
                  }
                : {}),
            },
          ],
        },
      ],

      order: [["nama_lengkap", "ASC"]],
    });

    const toNumber = (value) => {
      if (!value) return 0;

      return Number(
        String(value)
          .replace(/\./g, "")
          .replace(/,/g, "")
          .replace(/[^\d]/g, "")
      ) || 0;
    };

    const data = siswa.map((item) => {
      const json = item.toJSON();

      const targetPpdb = 2800000;

      const totalDaftar =
        json.log_ppdb
          ?.filter((log) => log.jenis === "d")
          .reduce((total, log) => {
            return total + toNumber(log.nominal);
          }, 0) || 0;

      const totalPpdb =
        json.log_ppdb
          ?.filter((log) => log.jenis === "p")
          .reduce((total, log) => {
            return total + toNumber(log.nominal);
          }, 0) || 0;

      const totalLainnya =
        json.log_ppdb
          ?.filter((log) => log.jenis === "l")
          .reduce((total, log) => {
            return total + toNumber(log.nominal);
          }, 0) || 0;

      return {
        ...json,

        target_ppdb: targetPpdb,

        total_daftar_ppdb: totalDaftar,
        total_bayar_ppdb: totalPpdb,
        total_lainnya_ppdb: totalLainnya,

        tunggakan_ppdb: Math.max(targetPpdb - totalPpdb, 0),
      };
    });

    return res.status(200).json({
      status: "success",
      total: data.length,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
};

const logPpdb = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      tahun,
      keyword = "",
      jenis,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const whereLog = {};

    if (jenis && jenis !== "semua") {
      whereLog.jenis = jenis;
    }

    const whereSiswa = {};

    if (tahun && tahun !== "semua") {
      whereSiswa.tahun = Number(tahun);
    }

    if (keyword && keyword.trim() !== "") {
      whereSiswa[Op.or] = [
        {
          nama_lengkap: {
            [Op.like]: `%${keyword.trim()}%`,
          },
        },
      ];
    }

    const { count, rows } = await LogPpdb.findAndCountAll({
      where: whereLog,
      limit: limitNumber,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
          required: true,
          where: whereSiswa,
          attributes: ["id_siswa", "nama_lengkap", "tahun"],
          include: [
            {
              model: SiswaBaru,
              as: "siswa_baru",
              required: false,
              attributes: ["id_siswa", "id_kelas"],
              include: [
                {
                  model: KelasPpdb,
                  as: "kelas_ppdb",
                  required: false,
                  attributes: ["id_kelas", "tingkat", "nama_kelas"],
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Data log PPDB berhasil diambil.",
      total: count,
      page: pageNumber,
      limit: limitNumber,
      totalPage: Math.ceil(count / limitNumber),
      data: rows,
    });
  } catch (error) {
    console.error("Error logPpdb:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data log PPDB.",
      error: error.message,
    });
  }
};

const deleteLogPpdb = async (req, res) => {
  const { id_log } = req.params;
  const { jenis, id_siswa } = req.body;

  try {
    // 🔹 ambil data log dulu
    const log = await LogPpdb.findOne({ where: { id_log } });

    if (!log) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // 🔹 hapus file bukti kalau ada
    if (log.bukti) {
      const filePath = path.join(__dirname, "..", log.bukti);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 🔹 update siswa kalau jenis daftar
    if (jenis === "d") {
      await SiswaPpdb.update(
        { bayar_daftar: "n" },
        { where: { id_siswa } }
      );
    }

    // 🔹 hapus log
    await LogPpdb.destroy({ where: { id_log } });

    return res.json({ message: "Data & bukti berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting log:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const isAdminKeuangan = (req) => {
  return String(req.user?.username || "")
    .toLowerCase()
    .replace(/\s+/g, "") === "adminkeuangan";
};

const sendJsonBackup = (res, fileName, data) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(JSON.stringify(data, null, 2));
};

const arsipSummary = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun } = req.params;

    const siswa = await SiswaPpdb.findAll({
      where: { tahun },
      attributes: ["id_siswa"],
      raw: true,
    });

    const ids = siswa.map((item) => item.id_siswa);

    const totalSiswa = ids.length;

    const totalSiswaBaru =
      ids.length > 0
        ? await SiswaBaru.count({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
          })
        : 0;

    const totalLogSpp =
      ids.length > 0
        ? await LogSpp.count({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
          })
        : 0;

    const totalLogPpdb =
      ids.length > 0
        ? await LogPpdb.count({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
          })
        : 0;

    return res.status(200).json({
      status: "success",
      message: "Summary arsip berhasil diambil.",
      data: {
        tahun: Number(tahun),
        total_siswa: totalSiswa,
        total_siswa_baru: totalSiswaBaru,
        total_log_spp: totalLogSpp,
        total_log_ppdb: totalLogPpdb,
      },
    });
  } catch (error) {
    console.error("Error arsipSummary:", error);
    return res.status(500).json({
      status: "gagal",
      message: "Gagal mengambil summary arsip.",
      error: error.message,
    });
  }
};

const backupArsipMaster = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const kelasPpdb = await KelasPpdb.findAll({ raw: true });
    const masterSpp = await JsMasterSpp.findAll({ raw: true });
    const masterPpdb = await MasterPpdb.findAll({ raw: true });

    const data = {
      app: "backup-master-keuangan",
      version: 1,
      created_at: new Date().toISOString(),
      kelas_ppdb: kelasPpdb,
      master_spp: masterSpp,
      master_ppdb: masterPpdb,
    };

    return sendJsonBackup(
      res,
      `backup-master-keuangan-${Date.now()}.json`,
      data
    );
  } catch (error) {
    return res.status(500).json({
      status: "gagal",
      message: "Gagal backup master.",
      error: error.message,
    });
  }
};

const backupArsipSiswa = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun } = req.params;

    const siswaPpdb = await SiswaPpdb.findAll({
      where: { tahun },
      raw: true,
    });

    const ids = siswaPpdb.map((item) => item.id_siswa);

    const siswaBaru =
      ids.length > 0
        ? await SiswaBaru.findAll({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
            raw: true,
          })
        : [];

    const data = {
      app: "backup-siswa-angkatan",
      version: 1,
      created_at: new Date().toISOString(),
      tahun: Number(tahun),
      siswa_ppdb: siswaPpdb,
      siswa_baru: siswaBaru,
    };

    return sendJsonBackup(
      res,
      `backup-siswa-angkatan-${tahun}-${Date.now()}.json`,
      data
    );
  } catch (error) {
    return res.status(500).json({
      status: "gagal",
      message: "Gagal backup siswa.",
      error: error.message,
    });
  }
};

const backupArsipLogSpp = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun } = req.params;

    const siswa = await SiswaPpdb.findAll({
      where: { tahun },
      attributes: ["id_siswa"],
      raw: true,
    });

    const ids = siswa.map((item) => item.id_siswa);

    const logSpp =
      ids.length > 0
        ? await LogSpp.findAll({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
            raw: true,
            order: [["created_at", "DESC"]],
          })
        : [];

    const data = {
      app: "backup-log-spp-angkatan",
      version: 1,
      created_at: new Date().toISOString(),
      tahun: Number(tahun),
      log_spp: logSpp,
    };

    return sendJsonBackup(
      res,
      `backup-log-spp-angkatan-${tahun}-${Date.now()}.json`,
      data
    );
  } catch (error) {
    return res.status(500).json({
      status: "gagal",
      message: "Gagal backup log SPP.",
      error: error.message,
    });
  }
};

const backupArsipLogPpdb = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun } = req.params;

    const siswa = await SiswaPpdb.findAll({
      where: { tahun },
      attributes: ["id_siswa"],
      raw: true,
    });

    const ids = siswa.map((item) => item.id_siswa);

    const logPpdb =
      ids.length > 0
        ? await LogPpdb.findAll({
            where: {
              id_siswa: {
                [Op.in]: ids,
              },
            },
            raw: true,
            order: [["created_at", "DESC"]],
          })
        : [];

    const data = {
      app: "backup-log-ppdb-angkatan",
      version: 1,
      created_at: new Date().toISOString(),
      tahun: Number(tahun),
      log_ppdb: logPpdb,
    };

    return sendJsonBackup(
      res,
      `backup-log-ppdb-angkatan-${tahun}-${Date.now()}.json`,
      data
    );
  } catch (error) {
    return res.status(500).json({
      status: "gagal",
      message: "Gagal backup log PPDB.",
      error: error.message,
    });
  }
};

const hapusArsipAngkatan = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun } = req.params;
    const { konfirmasi } = req.body;

    if (konfirmasi !== `HAPUS-${tahun}`) {
      return res.status(400).json({
        status: "gagal",
        message: `Konfirmasi salah. Ketik HAPUS-${tahun}`,
      });
    }

    const siswa = await SiswaPpdb.findAll({
      where: { tahun },
      attributes: ["id_siswa"],
      raw: true,
    });

    const ids = siswa.map((item) => item.id_siswa);

    if (ids.length === 0) {
      return res.status(404).json({
        status: "gagal",
        message: "Tidak ada siswa untuk tahun masuk ini.",
      });
    }

    const deletedLogSpp = await LogSpp.destroy({
      where: {
        id_siswa: {
          [Op.in]: ids,
        },
      },
    });

    const deletedLogPpdb = await LogPpdb.destroy({
      where: {
        id_siswa: {
          [Op.in]: ids,
        },
      },
    });

    const deletedSiswaBaru = await SiswaBaru.destroy({
      where: {
        id_siswa: {
          [Op.in]: ids,
        },
      },
    });

    const deletedSiswa = await SiswaPpdb.destroy({
      where: { tahun },
    });

    return res.status(200).json({
      status: "sukses",
      message: "Data angkatan berhasil dihapus.",
      data: {
        tahun: Number(tahun),
        deleted_log_spp: deletedLogSpp,
        deleted_log_ppdb: deletedLogPpdb,
        deleted_siswa_baru: deletedSiswaBaru,
        deleted_siswa: deletedSiswa,
      },
    });
  } catch (error) {
    console.error("Error hapusArsipAngkatan:", error);

    return res.status(500).json({
      status: "gagal",
      message: "Gagal menghapus data angkatan.",
      error: error.message,
    });
  }
};


module.exports = {
  masterSppData, dataSiswa, deleteLogPpdb,  arsipSummary,
backupArsipMaster,
backupArsipSiswa,
backupArsipLogSpp,
backupArsipLogPpdb,
hapusArsipAngkatan,
  logLastSpp,
  bayarSpp, logSpp, detailLog, updateLog, deleteLog,
  createMaster, updateMaster, detailMaster, deleteMaster, logLainnya, updateLoglainnya, deleteLogLainnya, createLogLainnya, laporan, logPpdb
};