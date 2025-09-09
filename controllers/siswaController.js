const {SiswaPpdb, SiswaBaru, KelasPpdb} = require('../models'); // Pastikan path benar

const dataSiswa = async (req, res) => {
    try {
      const siswa = await SiswaBaru.findAll({
          include: [{
            model: SiswaPpdb, as: 'siswa_ppdb'},
            {
            model: KelasPpdb, as: 'kelas_ppdb'
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
  }


  const siswaDetail = async (req, res) => {
    try {
        const { id } = req.params
        const siswa = await SiswaBaru.findOne({
          include: [{
            model: SiswaPpdb, as: 'siswa_ppdb', 
              where: { id_siswa: req.params.id_siswa }
          },
            {
            model: KelasPpdb, as: 'kelas_ppdb'
        }]
      });
      
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
  }
  
  const hitungSiswa = async(req, res) => {
      try {
          const {tingkat, status} = req.params
          const jmlSiswa = await SiswaBaru.count({
              include: [
                {
                  model: KelasPpdb,
                  as: 'kelas_ppdb',
                  where: { tingkat }
                },
                {
                  model: SiswaPpdb,
                  as: 'siswa_ppdb',
                  where: { status }
                }
              ]
            })

res.status(200).json({
        status: 'success',
        message: 'Data siswa berhasil diambil.',
        data: jmlSiswa,
      });
      } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data siswa.',
        error: error.message,
      });
    }
  }

  module.exports = {dataSiswa, siswaDetail, hitungSiswa};