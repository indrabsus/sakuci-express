const { JsMasterSpp, LogSpp, SiswaPpdb, SiswaBaru, KelasPpdb, LogLuarSpp, LogPpdb, MasterPpdb, RiwayatKelas } = require("../models"); // Pastikan path benar
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

    // 🔎 Untuk bulan reguler (1-12), izinkan pembayaran bertahap/cicilan di
    // bulan yang sama (misal bayar 200rb hari ini, 50rb besok) - tapi total
    // yang sudah dibayar + pembayaran baru ini tidak boleh melebihi nominal
    // SPP bulan tersebut (dari master SPP sesuai tahun angkatan & tingkat
    // siswa saat ini).
    if (bulan <= 12) {
      const existingLogs = await LogSpp.findAll({
        where: { id_siswa, bulan, kelas, status },
      });

      const totalSudahBayar = existingLogs.reduce(
        (sum, log) => sum + Number(log.nominal || 0),
        0
      );

      const siswa = await SiswaPpdb.findOne({ where: { id_siswa } });
      const master = siswa
        ? await JsMasterSpp.findOne({ where: { tahun: siswa.tahun } })
        : null;

      let nominalSppBulan = 0;

      if (master) {
        const tingkatKelas = String(kelas);

        if (tingkatKelas === "10") nominalSppBulan = Number(master.spp10 || 0);
        else if (tingkatKelas === "11") nominalSppBulan = Number(master.spp11 || 0);
        else if (tingkatKelas === "12") {
          // Kelas 12 cuma nagih SPP 10 bulan (Juli-April), bukan 12 bulan
          // penuh - total setahun dipertahankan sama dengan menaikkan
          // nominal per bulannya (x12/10). Harus sinkron dengan
          // getNominalSpp() di frontend (app/dashboard/pembayaran/page.tsx).
          nominalSppBulan = Math.round((Number(master.spp12 || 0) * 12) / 10);
        }
      }

      if (nominalSppBulan > 0 && totalSudahBayar + Number(nominal) > nominalSppBulan) {
        const sisaTagihan = Math.max(nominalSppBulan - totalSudahBayar, 0);

        return res.status(400).json({
          status: "gagal",
          message: `Pembayaran melebihi sisa tagihan SPP bulan ini. Sisa tagihan: Rp ${sisaTagihan.toLocaleString("id-ID")}`,
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
    const {
      keyword,
      tingkat,
      tahun_ajaran,
      start_date,
      end_date,
      page = 1,
      limit = 50,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const whereSiswa = {};

    if (keyword) {
      whereSiswa.nama_lengkap = {
        [Op.like]: `%${keyword}%`,
      };
    }

    const whereLog = {};

    if (start_date || end_date) {
      whereLog.created_at = {};

      if (start_date) {
        whereLog.created_at[Op.gte] = new Date(`${start_date}T00:00:00`);
      }

      if (end_date) {
        whereLog.created_at[Op.lte] = new Date(`${end_date}T23:59:59.999`);
      }
    }

    const pakaiFilterTingkat = !!(tingkat && tingkat !== "semua");

    // Tetap butuh tahun_ajaran yang jelas biar riwayat_kelas yang di-join cuma
    // satu baris per siswa (bukan sekalian semua tahun) - kalau tidak dikirim,
    // pakai tahun ajaran aktif (terbaru).
    let tahunAjaranTerpakai = tahun_ajaran;

    if (!tahunAjaranTerpakai) {
      const latest = await RiwayatKelas.findOne({
        attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      });

      tahunAjaranTerpakai = latest?.tahun_ajaran || null;
    }

    const whereRiwayat = tahunAjaranTerpakai
      ? { tahun_ajaran: tahunAjaranTerpakai }
      : undefined;

    if (whereRiwayat && pakaiFilterTingkat) {
      whereRiwayat.tingkat = String(tingkat);
    }

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

      where: Object.keys(whereLog).length ? whereLog : undefined,

      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
          attributes: ["id_siswa", "nama_lengkap"],

          where: Object.keys(whereSiswa).length ? whereSiswa : undefined,
          required: true,

          include: [
            {
              // required: true (INNER JOIN) cuma dipaksa kalau lagi filter
              // tingkat - kalau tidak, tetap LEFT JOIN biar log lama yang
              // siswanya belum punya riwayat_kelas tetap muncul.
              model: RiwayatKelas,
              as: "riwayat_kelas",
              attributes: ["tahun_ajaran", "tingkat", "nama_kelas"],

              where: whereRiwayat,
              required: pakaiFilterTingkat,
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
      data: rows.map((item) => {
        const json = item.toJSON();
        const riwayat = json.siswa_ppdb?.riwayat_kelas?.[0] || null;

        return {
          ...json,
          siswa_ppdb: {
            ...json.siswa_ppdb,
            kelas_terkini: riwayat
              ? {
                  tingkat: riwayat.tingkat,
                  nama_kelas: riwayat.nama_kelas,
                  tahun_ajaran: riwayat.tahun_ajaran,
                }
              : null,
          },
        };
      }),
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
    const updateData = { ...req.body };

    // multer taruh file upload di req.file, bukan req.body - cuma timpa
    // bukti kalau memang ada file baru yang diupload.
    if (req.file) {
      updateData.bukti = "/uploads/bukti/" + req.file.filename;
    }

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

const dataSiswa = async (req, res) => {
  const { tingkat, nama_kelas, keyword, tahun_ajaran } = req.query;

  try {
    // Filter kelas dikirim sebagai nama_kelas langsung (bukan id_kelas dari
    // kelas_ppdb) - riwayat_kelas cuma nyimpen nama_kelas sebagai snapshot,
    // jadi filter-nya harus bersumber dari riwayat_kelas juga (lewat
    // /riwayat-kelas/kelas-list), bukan dari kelas_ppdb yang bisa beda
    // penamaan antar angkatan PPDB.

    // Kalau tahun_ajaran tidak dikirim, pakai tahun ajaran aktif (terbaru)
    // yang ada di riwayat_kelas.
    let tahunAjaranTerpakai = tahun_ajaran;

    if (!tahunAjaranTerpakai) {
      const latest = await RiwayatKelas.findOne({
        attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      });

      tahunAjaranTerpakai = latest?.tahun_ajaran || null;
    }

    if (!tahunAjaranTerpakai) {
      return res.status(200).json({
        status: "success",
        total: 0,
        data: [],
      });
    }

    const whereRiwayat = { tahun_ajaran: tahunAjaranTerpakai };

    if (tingkat) whereRiwayat.tingkat = String(tingkat);
    if (nama_kelas) whereRiwayat.nama_kelas = nama_kelas;

    const siswa = await SiswaPpdb.findAll({
      attributes: [
        "id_siswa",
        "nama_lengkap",
        "tahun",
        "status",
        "no_hp",
        "no_hp_ortu",
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
          // required: true (INNER JOIN) - siswa yang belum punya riwayat_kelas
          // untuk tahun ajaran ini otomatis tidak ikut muncul, tanpa fallback
          // ke kelas_ppdb.
          model: RiwayatKelas,
          as: "riwayat_kelas",
          attributes: ["tahun_ajaran", "tingkat", "nama_kelas"],
          where: whereRiwayat,
          required: true,
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

      const riwayat = json.riwayat_kelas[0];

      return {
        ...json,

        kelas_terkini: {
          tingkat: riwayat.tingkat,
          nama_kelas: riwayat.nama_kelas,
          tahun_ajaran: riwayat.tahun_ajaran,
        },

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
      tahun_ajaran: tahunAjaranTerpakai,
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
      tahun_ajaran,
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

    let tahunAjaranTerpakai = tahun_ajaran;

    if (!tahunAjaranTerpakai) {
      const latest = await RiwayatKelas.findOne({
        attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      });

      tahunAjaranTerpakai = latest?.tahun_ajaran || null;
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
              model: RiwayatKelas,
              as: "riwayat_kelas",
              required: false,
              attributes: ["tahun_ajaran", "tingkat", "nama_kelas"],
              where: tahunAjaranTerpakai
                ? { tahun_ajaran: tahunAjaranTerpakai }
                : undefined,
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
      data: rows.map((item) => {
        const json = item.toJSON();
        const riwayat = json.siswa_ppdb?.riwayat_kelas?.[0] || null;

        return {
          ...json,
          siswa_ppdb: {
            ...json.siswa_ppdb,
            kelas_terkini: riwayat
              ? {
                  tingkat: riwayat.tingkat,
                  nama_kelas: riwayat.nama_kelas,
                  tahun_ajaran: riwayat.tahun_ajaran,
                }
              : null,
          },
        };
      }),
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

const arsipTahunAjaranSummary = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun_ajaran } = req.query;

    if (!tahun_ajaran) {
      return res.status(400).json({
        status: "gagal",
        message: "Parameter tahun_ajaran wajib diisi.",
      });
    }

    const riwayat = await RiwayatKelas.findAll({
      where: { tahun_ajaran },
      attributes: ["id_siswa"],
      raw: true,
    });

    const ids = [...new Set(riwayat.map((item) => item.id_siswa))];

    const totalLogSpp =
      ids.length > 0
        ? await LogSpp.count({ where: { id_siswa: { [Op.in]: ids } } })
        : 0;

    const totalLogPpdb =
      ids.length > 0
        ? await LogPpdb.count({ where: { id_siswa: { [Op.in]: ids } } })
        : 0;

    return res.status(200).json({
      status: "success",
      message: "Summary tahun ajaran berhasil diambil.",
      data: {
        tahun_ajaran,
        total_riwayat_kelas: riwayat.length,
        total_siswa: ids.length,
        total_log_spp: totalLogSpp,
        total_log_ppdb: totalLogPpdb,
      },
    });
  } catch (error) {
    console.error("Error arsipTahunAjaranSummary:", error);

    return res.status(500).json({
      status: "gagal",
      message: "Gagal mengambil summary tahun ajaran.",
      error: error.message,
    });
  }
};

const backupArsipTahunAjaran = async (req, res) => {
  try {
    if (!isAdminKeuangan(req)) {
      return res.status(403).json({
        status: "gagal",
        message: "Akses ditolak. Hanya admin keuangan.",
      });
    }

    const { tahun_ajaran } = req.query;

    if (!tahun_ajaran) {
      return res.status(400).json({
        status: "gagal",
        message: "Parameter tahun_ajaran wajib diisi.",
      });
    }

    const riwayatKelas = await RiwayatKelas.findAll({
      where: { tahun_ajaran },
      raw: true,
    });

    const ids = [...new Set(riwayatKelas.map((item) => item.id_siswa))];

    const siswaPpdb =
      ids.length > 0
        ? await SiswaPpdb.findAll({
            where: { id_siswa: { [Op.in]: ids } },
            raw: true,
          })
        : [];

    const siswaBaru =
      ids.length > 0
        ? await SiswaBaru.findAll({
            where: { id_siswa: { [Op.in]: ids } },
            raw: true,
          })
        : [];

    const logSppData =
      ids.length > 0
        ? await LogSpp.findAll({
            where: { id_siswa: { [Op.in]: ids } },
            raw: true,
          })
        : [];

    const logPpdbData =
      ids.length > 0
        ? await LogPpdb.findAll({
            where: { id_siswa: { [Op.in]: ids } },
            raw: true,
          })
        : [];

    const data = {
      app: "backup-tahun-ajaran",
      version: 1,
      created_at: new Date().toISOString(),
      tahun_ajaran,
      riwayat_kelas: riwayatKelas,
      siswa_ppdb: siswaPpdb,
      siswa_baru: siswaBaru,
      log_spp: logSppData,
      log_ppdb: logPpdbData,
    };

    return sendJsonBackup(
      res,
      `backup-tahun-ajaran-${tahun_ajaran.replace(/\//g, "-")}-${Date.now()}.json`,
      data
    );
  } catch (error) {
    console.error("Error backupArsipTahunAjaran:", error);

    return res.status(500).json({
      status: "gagal",
      message: "Gagal backup tahun ajaran.",
      error: error.message,
    });
  }
};

// Restore = tambahkan baris yang hilang saja (dicocokkan lewat primary key),
// tidak menimpa data yang sudah ada - supaya aman diulang-ulang.
const restoreRows = async (model, pkField, rows, transaction) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const ids = rows.map((row) => row[pkField]).filter(Boolean);

  const existing = await model.findAll({
    where: { [pkField]: { [Op.in]: ids } },
    attributes: [pkField],
    raw: true,
    transaction,
  });

  const existingSet = new Set(existing.map((item) => item[pkField]));
  const toInsert = rows.filter(
    (row) => row[pkField] && !existingSet.has(row[pkField])
  );

  if (toInsert.length > 0) {
    await model.bulkCreate(toInsert, { transaction, ignoreDuplicates: true });
  }

  return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
};

const restoreArsipTahunAjaran = async (req, res) => {
  if (!isAdminKeuangan(req)) {
    return res.status(403).json({
      status: "gagal",
      message: "Akses ditolak. Hanya admin keuangan.",
    });
  }

  const { siswa_ppdb, siswa_baru, riwayat_kelas, log_spp, log_ppdb } = req.body;

  const t = await SiswaPpdb.sequelize.transaction();

  try {
    const rSiswa = await restoreRows(SiswaPpdb, "id_siswa", siswa_ppdb, t);
    const rSiswaBaru = await restoreRows(
      SiswaBaru,
      "id_siswa_baru",
      siswa_baru,
      t
    );
    const rRiwayat = await restoreRows(
      RiwayatKelas,
      "id_riwayat",
      riwayat_kelas,
      t
    );
    const rLogSpp = await restoreRows(LogSpp, "id_logspp", log_spp, t);
    const rLogPpdb = await restoreRows(LogPpdb, "id_log", log_ppdb, t);

    await t.commit();

    return res.status(200).json({
      status: "success",
      message: "Restore tahun ajaran selesai.",
      data: {
        siswa_ppdb: rSiswa,
        siswa_baru: rSiswaBaru,
        riwayat_kelas: rRiwayat,
        log_spp: rLogSpp,
        log_ppdb: rLogPpdb,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error restoreArsipTahunAjaran:", error);

    return res.status(500).json({
      status: "gagal",
      message: "Gagal restore tahun ajaran.",
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
arsipTahunAjaranSummary,
backupArsipTahunAjaran,
restoreArsipTahunAjaran,
  logLastSpp,
  bayarSpp, logSpp, detailLog, updateLog, deleteLog,
  createMaster, updateMaster, detailMaster, deleteMaster, logLainnya, updateLoglainnya, deleteLogLainnya, createLogLainnya, logPpdb
};