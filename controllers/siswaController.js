const {DataSiswa, Kelas, Jurusan, User, Role} = require('../models'); // Pastikan path benar

const dataSiswa = async (req, res) => {
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
  }


  const siswaDetail = async (req, res) => {
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
  }

  module.exports = {dataSiswa, siswaDetail};