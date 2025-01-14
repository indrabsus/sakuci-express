const express = require('express');
const router = express.Router();
const SiswaPpdb = require('../models/SiswaPpdb'); // Pastikan path benar

const formatNoHp = (no_hp) => {
  // Hapus semua karakter yang tidak diperlukan (spasi, tanda minus, tanda plus)
  let formatted = no_hp.replace(/[^0-9]/g, '');

  // Jika nomor telepon diawali dengan '0', ganti dengan '62'
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  } 
  // Jika nomor telepon diawali dengan '+62', hapus tanda '+'
  else if (formatted.startsWith('62') && formatted.charAt(0) === '0') {
    formatted = '62' + formatted.slice(1);
  }

  return formatted;
};

// Rute untuk mendapatkan semua data siswa PPDB
router.get('/siswa', async (req, res) => {
  try {
   const tahunSekarang = new Date().getFullYear();
    const siswa = await SiswaPpdb.findAll({
      where: { tahun: tahunSekarang },
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


router.post('/daftar', async (req, res) => {
  try {
    const {
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      jenkel,
      agama,
      alamat,
      nisn,
      nik_siswa,
      nama_ayah,
      nama_ibu,
      asal_sekolah,
      minat_jurusan1,
      minat_jurusan2,
      no_hp,
    } = req.body;

    const no_hpFormatted = formatNoHp(no_hp);
    const tahunSekarang = new Date().getFullYear();

    // Simpan data ke database dengan nilai default
    const newSiswa = await SiswaPpdb.create({
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      jenkel,
      agama,
      alamat,
      nisn,
      nik_siswa,
      nama_ayah,
      nama_ibu,
      asal_sekolah,
      minat_jurusan1,
      minat_jurusan2,
      no_hp: no_hpFormatted,
      tahun: tahunSekarang, // Tahun saat ini
      bayar_daftar: 'n',    // Default ke 'n'
    });

    return res.status(201).json({
      message: 'Pendaftaran berhasil!',
      data: newSiswa,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server!',
      error: error.message,
    });
  }
});

module.exports = router;
