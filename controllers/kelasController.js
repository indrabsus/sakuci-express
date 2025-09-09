const {KelasPpdb} = require('../models')
const dataKelas = async (req, res) => {
  try {
     const {tingkat} = req.params
    const kelas = await KelasPpdb.findAll({
        where: tingkat ? {tingkat} : {},
        order: [["nama_kelas", "ASC"]]
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
}

const dataKelasDetail = async (req, res) => {
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
  }

module.exports = {dataKelas, dataKelasDetail}