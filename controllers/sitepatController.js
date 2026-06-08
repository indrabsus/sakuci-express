const {Ujian, Kelas, Jurusan, UjianSitepat} = require('../models'); // Pastikan path benar

const dataUjian = async (req, res) => {
    try {
      const ujian = await Ujian.findAll({
            include:[{ model: Kelas, as: "kelas",
                include:[{ model: Jurusan, as: "jurusan" }],
                where: { id_kelas: req.params.id },
            }],
        }); // Mengambil semua data dari tabel siswa_ppdb
      res.status(200).json({
        status: 'success',
        message: 'Data berhasil diambil.',
        data: ujian,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data.',
        error: error.message,
      });
    }
  }
  
  const ujianku = async (req, res) => {
  try {
    const { token } = req.query;

    let ujian;

    if (token) {
      // kalau ada token → cari 1 data
      ujian = await UjianSitepat.findOne({
        where: { token }
      });

      if (!ujian) {
        return res.status(404).json({
          status: "error",
          message: "Token tidak ditemukan"
        });
      }
    } else {
      // kalau tidak ada token → ambil semua
      ujian = await UjianSitepat.findAll();
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil.",
      data: ujian,
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data.",
      error: error.message,
    });
  }
};

 

  module.exports = { dataUjian, ujianku };