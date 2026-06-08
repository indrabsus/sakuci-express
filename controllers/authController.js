const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  User,
  SiswaPpdb,
  DataUser,
  Role,
} = require("../models");

const authController = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        status: 400,
        message: "Username dan password wajib diisi",
      });
    }

    const user = await User.findOne({
      where: {
        username,
        acc: "y",
      },
      include: [
        {
          model: DataUser,
          required: false,
        },
        {
          model: Role,
          as: "role",
          required: false,
        },
      ],
    });

    if (user) {
      const passwordDatabase = String(user.password || "").replace(
        "$2y$",
        "$2a$"
      );

      const isPasswordValid = await bcrypt.compare(password, passwordDatabase);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 401,
          message: "Invalid Credentials",
        });
      }

      const namaRole = user.role?.nama_role || "";

      const payload = {
        userId: user.id,
        username: user.username,
        id_role: user.id_role,

        nama_role: namaRole,
        role: namaRole,

        gambar: user.DataUser?.gambar || null,
        id_data: user.DataUser?.id_data || "",
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      return res.status(200).json({
        message: "Login Successful (User)!",
        token,
        data: payload,
        status: 200,
      });
    }

    const siswa = await SiswaPpdb.findOne({
      where: {
        username,
      },
    });

    if (!siswa) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials",
      });
    }

    const passwordDatabase = String(siswa.password || "").replace(
      "$2y$",
      "$2a$"
    );

    const isPasswordValid = await bcrypt.compare(password, passwordDatabase);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials",
      });
    }

    const payload = {
      userId: siswa.id_siswa,
      username: siswa.username,
      id_role: 8,

      nama_role: "siswa",
      role: "siswa",

      gambar: siswa.gambar || null,
      id_data: siswa.id_siswa,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Login Successful (Siswa)!",
      token,
      data: payload,
      status: 200,
    });
  } catch (error) {
    console.error("Error login:", error);

    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { password_lama, password_baru, konfirmasi_password } = req.body;

    const userId = req.user.userId;
    const idRole = String(req.user.id_role);

    if (!userId) {
      return res.status(401).json({
        status: "gagal",
        message: "User tidak valid. Silakan login ulang.",
      });
    }

    if (!password_lama || !password_baru) {
      return res.status(400).json({
        status: "gagal",
        message: "Password lama dan password baru wajib diisi.",
      });
    }

    if (password_baru.length < 6) {
      return res.status(400).json({
        status: "gagal",
        message: "Password baru minimal 6 karakter.",
      });
    }

    if (konfirmasi_password && password_baru !== konfirmasi_password) {
      return res.status(400).json({
        status: "gagal",
        message: "Konfirmasi password tidak sama.",
      });
    }

    let akun = null;

    if (idRole === "8") {
      akun = await SiswaPpdb.findOne({
        where: {
          id_siswa: userId,
        },
      });
    } else {
      akun = await User.findOne({
        where: {
          id: userId,
        },
      });
    }

    if (!akun) {
      return res.status(404).json({
        status: "gagal",
        message: "Akun tidak ditemukan.",
      });
    }

    const passwordDatabase = String(akun.password || "").replace(
      "$2y$",
      "$2a$"
    );

    const cocok = await bcrypt.compare(password_lama, passwordDatabase);

    if (!cocok) {
      return res.status(400).json({
        status: "gagal",
        message: "Password lama salah.",
      });
    }

    const hashedPassword = await bcrypt.hash(password_baru, 10);

    await akun.update({
      password: hashedPassword,
    });

    return res.status(200).json({
      status: "sukses",
      message: "Password berhasil diubah.",
    });
  } catch (error) {
    console.error("Error change password:", error);

    return res.status(500).json({
      status: "gagal",
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
};

module.exports = {
  authController,
  changePassword,
};