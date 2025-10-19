const {SiswaPpdb, LogPpdb, KelasPpdb, SiswaBaru, LogSpp, DataUser, AbsenHarianSiswa, User, MataPelajaran,
  Agenda, AbsenSiswa, Nilai
} = require('../models'); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {axios, axiosInstance} = require('../config/axios');
const bcrypt = require('bcrypt');

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
    let updateData = { ...req.body };

    // ✅ Normalisasi no_hp jika ada di request
    if (updateData.no_hp) {
      updateData.no_hp = normalizePhone(updateData.no_hp);
    }

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
        { model: AbsenSiswa, as: "absen_siswa"},
        { model: Nilai, as: "nilai",
          include: [{ model: Agenda, as: 'agenda' }]
        },
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
    const { id_data } = req.params;

    let data;

    if (id_data) {
      // Cari satu user spesifik
      data = await DataUser.findOne({
        include: [
          { model: User, as: "user" },
          { model: Agenda, as: "agenda" }
        ],
        where: { id_data },
      });
    } else {
      // Ambil semua user sesuai role
      data = await DataUser.findAll({
        include: [
          { model: User, as: "user" },
          { model: Agenda, as: "agenda" }
        ],
        order: [["uid_fp", "ASC"]],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil!",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data.",
      error: error.message,
    });
  }
};

const dataGuru = async (req, res) => {
  try {
    let data;
      data = await DataUser.findAll({
        include: [
          { model: User, as: "user", where: { id_role: 6 } }
        ],
        order: [["uid_fp", "ASC"]],
      });

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil!",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data.",
      error: error.message,
    });
  }
};

const dataUserFp = async (req, res) => {
  try {
    const { uid_fp } = req.params;

    let data;

    if (uid_fp) {
      // Cari satu user spesifik
      data = await DataUser.findOne({
        include: [
          { model: User, as: "user" },
        ],
        where: { uid_fp },
      });
    } else {
      // Ambil semua user sesuai role
      data = await DataUser.findAll({
        include: [
          { model: User, as: "user" },
        ],
        order: [["uid_fp", "ASC"]],
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil!",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
      error: error.message,
    });
  }
};

const createUser = async (req, res) => {
  const t = await User.sequelize.transaction();
  
  try {
    const { id_role, nama_lengkap, nama_singkat, no_hp, uid_fp, jenkel } = req.body;
const normalizedPhone = normalizePhone(no_hp);
    // 🔎 Cek apakah UID sudah dipakai
    const existingUID = await DataUser.findOne({ where: { uid_fp } });
    if (existingUID) {
      return res.status(400).json({
        status: "error",
        message: `UID ${uid_fp} sudah digunakan oleh ${existingUID.nama_lengkap}`,
      });
    }

    // 🔑 Generate username
    const username = generateUsername(nama_lengkap);

    // 🔑 Hash password default
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 1. Tambahkan ke tabel User
    const newUser = await User.create(
      { 
        username, 
        id_role, 
        password: hashedPassword,
        acc: "y"
      },
      { transaction: t }
    );

    // 2. Tambahkan ke tabel DataUser
    const newDataUser = await DataUser.create(
      {
        id_user: newUser.id,
        nama_lengkap,
        nama_singkat,
        no_hp: normalizedPhone,
        uid_fp,
        jenkel,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      status: "success",
      message: "User dan DataUser berhasil ditambahkan!",
      data: {
        user: newUser,
        dataUser: newDataUser,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      status: "error",
      message: "Gagal menambahkan user.",
      error: error.message,
    });
  }
};

// 🔧 Helper function untuk username
function generateUsername(nama_lengkap) {
  let cleanName = nama_lengkap.replace(/[^a-zA-Z0-9]/g, ""); // hapus spasi, titik, simbol
  let namePart = cleanName.substring(0, 6).toLowerCase();
  let randomNumber = Math.floor(100 + Math.random() * 900); // angka 100-999
  return `${randomNumber}${namePart}`;
}

// 🔧 Helper function untuk normalisasi nomor HP
function normalizePhone(no_hp) {
  if (!no_hp) return null;

  // Hapus semua karakter selain angka
  let clean = no_hp.replace(/\D/g, "");

  // Jika diawali "0", ganti dengan "62"
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  }

  return clean;
}

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

const deleteUser = async (req, res) => {
    const { id_user } = req.params;

    try {
        const data = await User.findByPk(id_user);

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
    detailSiswa, detailUser, updateSiswa, updateUser, dataSiswa, dataUser, dataMapel, createUser, deleteUser, dataUserFp,
    dataGuru
}