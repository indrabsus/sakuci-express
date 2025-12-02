// controllers/rfidController.js
const { AbsenHarianSiswa, SiswaPpdb, SiswaBaru, KelasPpdb } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const presensiHarian = async (req, res) => {
  try {
    const { id_kelas } = req.params;

    const whereClause = {
      status: '0'
    };

    // Kalau ada filter kelas
    if (id_kelas) {
      whereClause['$siswa_ppdb.siswa_baru.id_kelas$'] = id_kelas;
    }

    const data = await AbsenHarianSiswa.findAll({
      include: [
        {
          model: SiswaPpdb,
          as: 'siswa_ppdb',
          include: [
            {
              model: SiswaBaru,
              as: 'siswa_baru',
              include: [
                { model: KelasPpdb, as: 'kelas_ppdb' }
              ]
            }
          ]
        }
      ],
      where: whereClause,
      order: [['waktu', 'DESC']]
    });

    return res.json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

const deleteHarian = async (req, res) => {
    const { id_harian } = req.params;

    try {
        const data = await AbsenHarianSiswa.findByPk(id_harian);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        await data.destroy();

        res.status(200).json({
            status: 'success',
            message: 'berhasil menghapus data!'
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal menghapus data!',
            error: error.message
        });
    }
};

const updateHarian = async (req, res) => {
    const { id_harian } = req.params; // ambil id dari URL
    const { waktu } = req.body;

    try {
        const data = await AbsenHarianSiswa.findByPk(id_harian);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        // update data
        await data.update({ waktu });

        res.status(200).json({
            status: 'success',
            message: 'berhasil mengupdate data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengupdate data!',
            error: error.message
        });
    }
};

const detailHarian = async (req, res) => {
    const { id_harian } = req.params;

    try {
        const data = await AbsenHarianSiswa.findOne({
            where: {
                id_harian
            }
        });

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'berhasil menghapus data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal menghapus data!',
            error: error.message
        });
    }
};

module.exports = { deleteHarian, updateHarian, detailHarian, presensiHarian };