const { RiwayatKelas, SiswaPpdb, KelasTahun } = require("../models");
const { fn, col, Op, literal } = require("sequelize");

const daftarTahunAjaran = async (req, res) => {
  try {
    // kelas_tahun disertakan supaya tahun ajaran yang baru dibuat (lewat
    // "Tambah Tahun Ajaran" / kelas kosong) tetap muncul walau belum ada
    // satu pun siswa yang masuk riwayat_kelas untuk tahun itu.
    const [riwayatRows, kelasTahunRows] = await Promise.all([
      RiwayatKelas.findAll({
        attributes: [[fn("DISTINCT", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      }),
      KelasTahun.findAll({
        attributes: [[fn("DISTINCT", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      }),
    ]);

    const tahunSet = new Set([
      ...riwayatRows.map((row) => row.tahun_ajaran),
      ...kelasTahunRows.map((row) => row.tahun_ajaran),
    ]);

    return res.status(200).json({
      status: "success",
      message: "Daftar tahun ajaran berhasil diambil.",
      data: Array.from(tahunSet).sort().reverse(),
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
    const [riwayatResult, kelasTahunResult] = await Promise.all([
      RiwayatKelas.findOne({
        attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      }),
      KelasTahun.findOne({
        attributes: [[fn("MAX", col("tahun_ajaran")), "tahun_ajaran"]],
        raw: true,
      }),
    ]);

    const kandidat = [riwayatResult?.tahun_ajaran, kelasTahunResult?.tahun_ajaran].filter(Boolean);
    const tahunAktif = kandidat.length ? kandidat.sort().reverse()[0] : null;

    return res.status(200).json({
      status: "success",
      message: "Tahun ajaran aktif berhasil diambil.",
      data: {
        tahun_ajaran: tahunAktif,
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
          attributes: ["id_siswa", "nama_lengkap", "nisn", "status", "jenkel"],
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

const pindahKelas = async (req, res) => {
  const { id_siswa, tahun_ajaran, tingkat, nama_kelas } = req.body;

  if (!id_siswa || !tahun_ajaran || !tingkat || !nama_kelas) {
    return res.status(400).json({
      status: "error",
      message: "id_siswa, tahun_ajaran, tingkat, dan nama_kelas wajib diisi.",
    });
  }

  try {
    // Pindah kelas = createRiwayat tapi upsert: kalau siswa sudah punya
    // riwayat untuk tahun ajaran ini, kelasnya diganti; kalau belum, dibuatkan
    // baru - jadi satu endpoint ini bisa dipakai baik untuk memindah kelas di
    // tahun ajaran yang sama maupun memasukkan ke tahun ajaran lain.
    const [riwayat, created] = await RiwayatKelas.findOrCreate({
      where: { id_siswa, tahun_ajaran },
      defaults: { tingkat, nama_kelas },
    });

    if (!created) {
      await riwayat.update({ tingkat, nama_kelas });
    }

    return res.status(200).json({
      status: "success",
      message: created
        ? "Siswa berhasil dimasukkan ke kelas."
        : "Siswa berhasil dipindahkan ke kelas baru.",
      data: riwayat,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal memindahkan kelas siswa.",
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

const daftarKelasByTahun = async (req, res) => {
  const { tahun_ajaran } = req.query;

  if (!tahun_ajaran) {
    return res.status(400).json({
      status: "error",
      message: "Parameter tahun_ajaran wajib diisi.",
    });
  }

  try {
    // kelas_tahun disertakan supaya kelas yang dibuat kosong (belum ada
    // siswa sama sekali, jadi tidak muncul di riwayat_kelas) tetap terlihat
    // di daftar kelas.
    const [riwayatRows, kelasTahunRows] = await Promise.all([
      RiwayatKelas.findAll({
        attributes: ["tingkat", "nama_kelas"],
        where: { tahun_ajaran },
        group: ["tingkat", "nama_kelas"],
        raw: true,
      }),
      KelasTahun.findAll({
        attributes: ["tingkat", "nama_kelas"],
        where: { tahun_ajaran },
        raw: true,
      }),
    ]);

    const merged = new Map();
    [...riwayatRows, ...kelasTahunRows].forEach((row) => {
      merged.set(`${row.tingkat}|${row.nama_kelas}`, row);
    });

    const rows = Array.from(merged.values()).sort((a, b) => {
      if (a.tingkat !== b.tingkat) return String(a.tingkat).localeCompare(String(b.tingkat));
      return String(a.nama_kelas).localeCompare(String(b.nama_kelas));
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar kelas berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar kelas.",
      error: error.message,
    });
  }
};

const buatKelas = async (req, res) => {
  const { tahun_ajaran, tingkat, nama_kelas } = req.body;

  if (!tahun_ajaran || !tingkat || !nama_kelas) {
    return res.status(400).json({
      status: "error",
      message: "tahun_ajaran, tingkat, dan nama_kelas wajib diisi.",
    });
  }

  try {
    // findOrCreate supaya idempoten - kalau kelas ini kebetulan sudah ada
    // (baik di kelas_tahun maupun sudah punya siswa di riwayat_kelas),
    // permintaan ulang tidak menghasilkan error atau duplikat.
    const [kelas] = await KelasTahun.findOrCreate({
      where: { tahun_ajaran, tingkat, nama_kelas },
    });

    return res.status(200).json({
      status: "success",
      message: "Kelas berhasil dibuat.",
      data: kelas,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal membuat kelas.",
      error: error.message,
    });
  }
};

const belumMasukKelas = async (req, res) => {
  const { tahun_ajaran, search } = req.query;

  if (!tahun_ajaran) {
    return res.status(400).json({
      status: "error",
      message: "Parameter tahun_ajaran wajib diisi.",
    });
  }

  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const where = {
      status: "aktif",
      id_siswa: {
        [Op.notIn]: literal(
          `(SELECT id_siswa FROM riwayat_kelas WHERE tahun_ajaran = ${RiwayatKelas.sequelize.escape(
            tahun_ajaran
          )})`
        ),
      },
    };

    if (search) {
      where[Op.or] = [
        { nama_lengkap: { [Op.like]: `%${search}%` } },
        { nisn: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await SiswaPpdb.findAndCountAll({
      where,
      attributes: ["id_siswa", "nama_lengkap", "nisn", "jenkel"],
      order: [["nama_lengkap", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.status(200).json({
      status: "success",
      message: "Data siswa belum masuk kelas berhasil diambil.",
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa belum masuk kelas.",
      error: error.message,
    });
  }
};

module.exports = {
  riwayatSiswa,
  kelasTerkini,
  riwayatByTahun,
  daftarTahunAjaran,
  daftarKelasByTahun,
  buatKelas,
  createRiwayat,
  naikKelas,
  pindahKelas,
  deleteRiwayat,
  tahunAjaranAktif,
  belumMasukKelas,
};
