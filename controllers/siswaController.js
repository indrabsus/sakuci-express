const {SiswaPpdb, SiswaBaru, KelasPpdb, RiwayatKelas} = require('../models'); // Pastikan path benar
const { Op } = require('sequelize');

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

  const SORTABLE_COLUMNS = {
    nama: 'nama_lengkap',
    nisn: 'nisn',
    tahun: 'tahun',
    status: 'status',
    username: 'username',
  };

  const masterSiswa = async (req, res) => {
    try {
      const { tahun, status, search, sort_by, sort_dir, tahun_ajaran, kelas } = req.query;
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);

      const where = {};

      if (tahun) where.tahun = tahun;
      if (status) where.status = status;

      if (search) {
        where[Op.or] = [
          { nama_lengkap: { [Op.like]: `%${search}%` } },
          { nisn: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
        ];
      }

      const dir = String(sort_dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

      const order =
        sort_by === 'kelas'
          ? [
              [
                { model: SiswaBaru, as: 'siswa_baru' },
                { model: KelasPpdb, as: 'kelas_ppdb' },
                'nama_kelas',
                dir,
              ],
            ]
          : [[SORTABLE_COLUMNS[sort_by] || 'nama_lengkap', dir]];

      const include = [
        {
          model: SiswaBaru,
          as: 'siswa_baru',
          required: false,
          include: [{ model: KelasPpdb, as: 'kelas_ppdb' }],
        },
      ];

      // Filter kelas memakai riwayat_kelas (kelas aktual per tahun ajaran),
      // bukan kelas_ppdb (cuma penempatan awal saat PPDB).
      if (kelas && tahun_ajaran) {
        include.push({
          model: RiwayatKelas,
          as: 'riwayat_kelas',
          required: true,
          where: { tahun_ajaran, nama_kelas: kelas },
          attributes: [],
        });
      }

      const { count, rows } = await SiswaPpdb.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset: (page - 1) * limit,
        distinct: true,
      });

      res.status(200).json({
        status: 'success',
        message: 'Data siswa berhasil diambil.',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data siswa.',
        error: error.message,
      });
    }
  }

  module.exports = {dataSiswa, siswaDetail, hitungSiswa, masterSiswa};