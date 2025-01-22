const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
const Kelas = require('../models/Kelas'); // Pastikan path benar
const Jurusan = require('../models/Jurusan'); // Pastikan path benar

router.get('/data', async (req, res) => {
  try {
    const kelas = await Kelas.findAll({
        include: [
    { model: Jurusan, as: 'jurusan', attributes: ['nama_jurusan','singkatan'] }
  ],
    }); // Mengambil semua data dari tabel siswa_ppdb
    res.status(200).json({
      status: 'success',
      message: 'Data kelas berhasil diambil.',
      data: kelas,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    });
  }
});


router.get('/data/:id', async (req, res) => {
  try {
    const kelas = await Kelas.findAll({
      where: { id_kelas: req.params.id },
      include: [
    { model: Jurusan, as: 'jurusan', attributes: ['nama_jurusan','singkatan'] }
  ]
    }); // Mengambil semua data dari tabel siswa_ppdb
    res.status(200).json({
      status: 'success',
      message: 'Data kelas berhasil diambil.',
      data: kelas,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    });
  }
});

module.exports = router;