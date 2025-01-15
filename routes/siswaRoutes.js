const express = require('express');
const router = express.Router();
const SiswaPpdb = require('../models/DataSiswa'); // Pastikan path benar


router.get('/data/:id', async (req, res) => {
  try {
    const siswa = await DataSiswa.findAll({
      where: { id_user: req.params.id },
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