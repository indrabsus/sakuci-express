const express = require('express');
const router = express.Router();
const SiswaPpdb = require('../models/SiswaPpdb'); // Pastikan path benar
const JurusanPpdb = require('../models/JurusanPpdb'); // Pastikan path benar
const MasterPpdb = require('../models/MasterPpdb'); // Pastikan path benar
const {axios, axiosInstance} = require('../config/axios');


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

    // Format nomor HP
    const no_hpFormatted = formatNoHp(no_hp);
    const tahunSekarang = new Date().getFullYear();

    // Simpan data ke database
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
      tahun: tahunSekarang,
      bayar_daftar: 'n',
    });

    // Kirim pesan notifikasi
    try {
      const kirimpesan = await axios.post('https://ppdbwa.sakuci.id/notifuser', {
        nomor: no_hpFormatted,
        pesan: `Terima Kasih ${nama_lengkap} sudah mendaftar di PPDB SMK Sangkuriang 1 Cimahi, silakan ketik ok untuk info lebih lanjut!`,
      });
    const text = `Pemberitahuan, ada siswa baru mendaftar dengan nama ${nama_lengkap}, dan asal sekolah dari ${asal_sekolah}, no Whatsapp : https://wa.me/${no_hpFormatted}`;
    const tele = await axios.get(`https://api.telegram.org/bot${process.env.API_BOT_TELEGRAM}/sendMessage?chat_id=${process.env.CHAT_ID_TELEGRAM}&text=${text}`);
    } catch (notifError) {
      console.error('Gagal mengirim pesan:', notifError.response?.data || notifError.message);
    }

    // Berikan respons sukses
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

router.get('/jurusan', async (req, res) => {
     try {
    const tahunSekarang = new Date().getFullYear();
   const jurusanPpdb = await JurusanPpdb.findAll({
       include:[{
           model: MasterPpdb, as: 'master_ppdb',
           where:{
               tahun: tahunSekarang
           }
       }]
   })
    res.status(200).json({
      status: 'success',
      message: 'Data siswa berhasil diambil.',
      data: jurusanPpdb,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data siswa.',
      error: error.message,
    });
  }
    
})


module.exports = router;
