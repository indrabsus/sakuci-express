const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, SiswaPpdb, DataUser } = require('../models');

const authController = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 🔹 Cek di tabel User dulu
    let user = await User.findOne({
  where: { username, acc: "y" },
  include: [
    {
      model: DataUser,
      required: false, // inner join (kalau mau left join, hapus atau set false)
    },
  ],
});



    if (user) {
      // Validasi password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password.replace('$2y$', '$2a$')
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid Credentials' });
      }

      const payload = {
  userId: user.id,
  username: user.username,
  id_role: user.id_role,
  gambar: user.DataUser?.gambar || null, // ambil dari DataUser
};


      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      return res.status(200).json({
        message: 'Login Successful (User)!',
        token,
        data: payload,
        status: 200,
      });
    }

    // 🔹 Kalau gak ketemu di User, cek di SiswaPpdb
    let siswa = await SiswaPpdb.findOne({
      where: { username }, // sesuaikan field username di tabel siswa
    });

    if (!siswa) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    // 🔹 Validasi password siswa
    const isPasswordValid = await bcrypt.compare(
      password,
      siswa.password.replace('$2y$', '$2a$')
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    // Payload untuk siswa → id_role = 8
    const payload = {
      userId: siswa.id_siswa, // pastikan fieldnya benar
      username: siswa.username,
      id_role: 8,
      gambar: siswa.gambar
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.status(200).json({
      message: 'Login Successful (Siswa)!',
      token,
      data: payload,
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { authController };