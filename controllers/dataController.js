const {SiswaPpdb, LogPpdb, KelasPpdb, SiswaBaru, LogSpp, DataUser, AbsenHarianSiswa, User, MataPelajaran} = require('../models'); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {axios, axiosInstance} = require('../config/axios');

const detailSiswa = async (req, res) => {
    try {
        const { id_siswa } = req.params;

        const siswa = await SiswaPpdb.findOne({
            include: [{ model: LogPpdb, as: 'log_ppdb' }, {model: LogSpp, as: 'log_spp'}],
            where: { id_siswa },
        });

        console.log("Hasil pencarian:", siswa);

        if (!siswa) {
            return res.status(404).json({
                status: "error",
                message: "Siswa tidak ditemukan.",
                data: null,
            });
        }

        res.status(200).json({
            status: "success",
            message: "Data siswa berhasil diambil.",
            data: siswa,
        });
    } catch (error) {
        console.error("Error saat mengambil data siswa:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil data siswa.",
            error: error.message,
        });
    }
};

const detailUser = async (req, res) => {
    try {
        const { id_user } = req.params;

        const user = await DataUser.findOne({
            where: { id_user },
        });

        console.log("Hasil pencarian:", user);

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User tidak ditemukan.",
                data: null,
            });
        }

        res.status(200).json({
            status: "success",
            message: "Data user berhasil diambil.",
            data: user,
        });
    } catch (error) {
        console.error("Error saat mengambil data user:", error);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil data siswa.",
            error: error.message,
        });
    }
};

const updateSiswa = async (req, res) => {
  try {
    const { id_siswa } = req.params;
    const updateData = req.body;

    const siswa = await SiswaPpdb.findOne({ where: { id_siswa } });

    if (!siswa) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan.",
        data: null,
      });
    }

    await siswa.update(updateData);

    res.status(200).json({
      status: "success",
      message: "Data siswa berhasil diperbarui.",
      data: siswa,
    });
  } catch (error) {
    console.error("Error saat update data siswa:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal update data siswa.",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id_user } = req.params;
    const updateData = req.body;

    const user = await DataUser.findOne({ where: { id_user } });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan.",
        data: null,
      });
    }

    await user.update(updateData);

    res.status(200).json({
      status: "success",
      message: "Data user berhasil diperbarui.",
      data: user,
    });
  } catch (error) {
    console.error("Error saat update data user:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal update data user.",
      error: error.message,
    });
  }
};

const dataSiswa = async (req, res) => {
  try {
    const { tingkat, id_kelas } = req.params;

    const siswa = await SiswaPpdb.findAll({
      include: [
        { model: LogPpdb, as: "log_ppdb" },
        { model: LogSpp, as: "log_spp" },
        { model: AbsenHarianSiswa, as: "absen_harian_siswa"},
        {
          model: SiswaBaru,
          as: "siswa_baru",
          required: true,
          include: [
            {
              model: KelasPpdb,
              as: "kelas_ppdb",
              ...(tingkat || id_kelas
                ? { where: { ...(tingkat && { tingkat }), ...(id_kelas && { id_kelas }) } }
                : {}),
            },
          ],
        },
      ],
      order: [["nama_lengkap", "ASC"]],
    });

    res.status(200).json({
      status: "success",
      message: `Data siswa berhasil diambil${tingkat ? ` untuk tingkat ${tingkat}` : ""}.`,
      data: siswa,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
};

const dataUser = async (req, res) => {
  try {
    const { id_role } = req.params;

    const data = await DataUser.findAll({
      include: [
        { model: User, as: "user", where: {id_role}},
      ],
      order: [["uid_fp", "ASC"]],
    });

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil!",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
};

const dataMapel = async (req, res) => {
  try {
    const { id_mapel } = req.params;

    const data = await MataPelajaran.findAll();

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil!",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
};

module.exports = {
    detailSiswa, detailUser, updateSiswa, updateUser, dataSiswa, dataUser, dataMapel
}