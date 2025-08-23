const {Ujian, Kelas, Jurusan} = require('../models'); // Pastikan path benar

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

 

  module.exports = { dataUjian };