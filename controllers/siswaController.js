const {SiswaPpdb, SiswaBaru, KelasPpdb, RiwayatKelas} = require('../models'); // Pastikan path benar
const { Op, literal } = require('sequelize');

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
      const { tahun, status, search, sort_by, sort_dir, tahun_ajaran, kelas, tingkat, belum_kelas } = req.query;
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

      // Filter "belum ada kelas": siswa yang belum punya riwayat_kelas sama
      // sekali untuk tahun ajaran ini - dicek via subquery karena ini soal
      // ketiadaan baris, bukan sesuatu yang bisa difilter lewat include.
      if (belum_kelas === '1' && tahun_ajaran) {
        where.id_siswa = {
          [Op.notIn]: literal(
            `(SELECT id_siswa FROM riwayat_kelas WHERE tahun_ajaran = ${SiswaPpdb.sequelize.escape(tahun_ajaran)})`
          ),
        };
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

      // riwayat_kelas dipakai untuk menampilkan kelas aktual siswa (per tahun
      // ajaran terpilih) di kolom Kelas, bukan kelas_ppdb (cuma penempatan
      // awal saat PPDB). Filter kelas memakai data yang sama - required cuma
      // dipaksa true (jadi INNER JOIN yang menyaring baris) kalau kelas juga
      // dipilih, supaya menampilkan tanpa memfilter tetap bisa dipakai sendiri.
      // tingkat disertakan karena nama_kelas bisa dipakai ulang di tingkat
      // berbeda (mis. "MPLB 1" ada di tingkat 11 dan 12) - tanpa itu filter
      // kelas bisa menyatukan siswa dari dua kelas yang sebenarnya berbeda.
      if (tahun_ajaran) {
        const riwayatWhere = { tahun_ajaran };
        if (kelas) riwayatWhere.nama_kelas = kelas;
        if (tingkat) riwayatWhere.tingkat = tingkat;

        include.push({
          model: RiwayatKelas,
          as: 'riwayat_kelas',
          required: !!kelas,
          where: riwayatWhere,
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