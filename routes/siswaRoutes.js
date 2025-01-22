const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT
const DataSiswa = require('../models/DataSiswa'); // Pastikan path benar
const Kelas = require('../models/Kelas'); // Pastikan path benar
const Jurusan = require('../models/Jurusan'); // Pastikan path benar
const User = require('../models/User'); // Pastikan path benar
const Role = require('../models/Role'); // Pastikan path benar

router.get('/data', async (req, res) => {
  try {
    const siswa = await DataSiswa.findAll({
        include: [{
          model: Kelas, as: 'kelas',
          include: [{
              model: Jurusan, as: 'jurusan'
          }]
      },{
          model: User, as: 'user',
          include: [{
              model: Role, as: 'role'
          }]
      }]
    }); // Mengambil semua data dari tabel siswa_ppdb
    res.status(200).json({
      status: 'success',
      message: 'Data siswa berhasil diambil.',
      data: siswa,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data siswa.',
      error: error.message,
    });
  }
});


router.get('/data/:id', async (req, res) => {
  try {
    const siswa = await DataSiswa.findOne({
      where: { id_user: req.params.id },
      include: [{
          model: Kelas, as: 'kelas',
          include: [{
              model: Jurusan, as: 'jurusan'
          }]
      },{
          model: User, as: 'user',
          include: [{
              model: Role, as: 'role'
          }]
      }]
    }); // Mengambil semua data dari tabel siswa_ppdb
    res.status(200).json({
      status: 'success',
      message: 'Data siswa berhasil diambil.',
      data: siswa,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data siswa.',
      error: error.message,
    });
  }
});

module.exports = router;