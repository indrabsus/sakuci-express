const {SiswaPpdb, LogPpdb, KelasPpdb, SiswaBaru, LogSpp, DataUser, AbsenHarianSiswa, User,
  AbsenSiswa
} = require('../models'); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const bcrypt = require('bcrypt');

const detailSiswa = async (req, res) => {
    try {
        const { id_siswa } = req.params;

        const siswa = await SiswaPpdb.findOne({
            include: [{ model: LogPpdb, as: 'log_ppdb' }, {model: LogSpp, as: 'log_spp'}],
            where: { id_siswa },
        });

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

const updateUser = async (req, res) => {
  try {
    const { id_data } = req.params;
    let updateData = { ...req.body };

    // ✅ Normalisasi no_hp jika ada di request
    if (updateData.no_hp) {
      updateData.no_hp = normalizePhone(updateData.no_hp);
    }

    const user = await DataUser.findOne({ where: { id_data } });

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
      limit: 100,
      where: {
          status: "aktif"
      },

      include: [
        { model: LogPpdb, as: "log_ppdb" },
        { model: LogSpp, as: "log_spp" },
        { model: AbsenHarianSiswa, as: "absen_harian_siswa" },
        { model: AbsenSiswa, as: "absen_siswa" },

        {
          model: SiswaBaru,
          as: "siswa_baru",
          required: true,

          include: [
            {
              model: KelasPpdb,
              as: "kelas_ppdb",

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

    res.status(200).json({
      status: "success",
      message: `Data siswa berhasil diambil${
        tingkat ? ` untuk tingkat ${tingkat}` : ""
      }.`,
      total: siswa.length,
      data: siswa,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data siswa.",
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

const dataTendik = async (req, res) => {
  try {
    let data;
      data = await DataUser.findAll({
        include: [
          { model: User, as: "user", where: { id_role: 7 } }
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
    detailSiswa, updateUser, dataSiswa, createUser, deleteUser,
    dataGuru, dataTendik
}