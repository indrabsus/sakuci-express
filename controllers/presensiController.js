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
            message: 'berhasil baca data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal baca data!',
            error: error.message
        });
    }
};

const cekHarian = async (req, res) => {
    const { id_siswa } = req.params;

    try {
        const startOfDay = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const endOfDay = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');

        const data = await AbsenHarianSiswa.findOne({
            where: {
                id_siswa,
                waktu: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        if (!data) {
            return res.json({
                status: "ok",
                message: "belum absen",
                kategori: "belum absen",
                id_siswa,
                tanggal: dayjs().format("YYYY-MM-DD")
            });
        }

        // AMBIL JAM ABSEN SISWA
        const jamAbsen = dayjs(data.waktu);

        const batasOnTime = dayjs().hour(6).minute(30).second(0);
        const batasToleransi = dayjs().hour(6).minute(45).second(0);

        let kategori = "";

        if (jamAbsen.isBefore(batasOnTime) || jamAbsen.isSame(batasOnTime)) {
            kategori = "on time";
        } else if (
            jamAbsen.isAfter(batasOnTime) &&
            (jamAbsen.isBefore(batasToleransi) || jamAbsen.isSame(batasToleransi))
        ) {
            kategori = "toleransi";
        } else {
            kategori = "terlambat";
        }

        return res.json({
            status: "ok",
            message: "hadir",
            kategori, // <--- tambahan
            id_siswa,
            tanggal: dayjs().format("YYYY-MM-DD")
        });

    } catch (error) {
        res.status(500).json({
            status: "gagal",
            message: "gagal baca data!",
            error: error.message
        });
    }
};

const logRfid = async (req, res) => {
  try {
    const { url, mesin } = req.params;

    // --- VALIDASI AWAL ---
    if (!url || !mesin) {
      return res.json([]); // kosongkan hasil
    }

    // --- AMBIL DATA DARI MESIN ---
    const response = await fetch(`http://${url}/${mesin}`);
    const logs = await response.json();

    // --- AMBIL DATA SISWA ---
    const dataSiswa = await SiswaPpdb.findAll({
      include: [
        {
          model: SiswaBaru,
          as: "siswa_baru",
          include: [{ model: KelasPpdb, as: "kelas_ppdb" }]
        }
      ]
    });

    // --- BUAT MAP UNTUK JOIN ---
    const mapUid = {};
    dataSiswa.forEach(s => mapUid[s.no_rfid] = s);

    // --- JOIN MANUAL ---
    const hasil = logs.map(item => ({
      uid: item.uid,
      waktu: item.timestamp,
      siswa: mapUid[item.uid] ?? null
    }));

    return res.json(hasil);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, logRfid };