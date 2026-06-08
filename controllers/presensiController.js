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

    if (!url || !mesin) {
      return res.json([]);
    }

    const response = await fetch(`http://${url}/${mesin}`);
    const logs = await response.json();

    const dataSiswa = await SiswaPpdb.findAll({
      include: [
        {
          model: SiswaBaru,
          as: "siswa_baru",
          include: [{ model: KelasPpdb, as: "kelas_ppdb" }]
        }
      ]
    });

    const mapUid = {};
    dataSiswa.forEach(s => (mapUid[s.no_rfid] = s));

    const hasil = logs
      .map(item => ({
        uid: item.uid,
        waktu: item.timestamp,
        siswa: mapUid[item.uid] ?? null
      }))
      .filter(item => item.siswa !== null); // hanya data valid

    return res.json(hasil);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const tarik = async (req, res) => {
  try {
    const { ip, mesin } = req.params;

    if (!ip || !mesin) {
      return res.json({ message: "IP atau mesin tidak ada" });
    }

    const url = `http://${ip}/${mesin}`;

    // 🔥 ambil data dari mesin
    const response = await fetch(url);
    const text = await response.text();

    console.log("RAW DATA:", text);

    // 🔥 ambil semua object {...} (ANTI JSON RUSAK)
    const matches = text.match(/{[^}]*}/g);

    if (!matches) {
      return res.status(500).json({
        message: "Tidak ada data valid dari mesin"
      });
    }

    let rfidData = [];

    for (let item of matches) {
      try {
        const cleanItem = item
          .replace(/,\s*}/g, "}") // hapus koma sebelum }
          .trim();

        const obj = JSON.parse(cleanItem);

        if (obj.uid && obj.timestamp) {
          rfidData.push(obj);
        }

      } catch (err) {
        console.log("SKIP DATA RUSAK:", item);
      }
    }

    if (rfidData.length === 0) {
      return res.status(500).json({
        message: "Semua data dari mesin rusak"
      });
    }

    // 🔁 proses data ke database
    for (let d of rfidData) {
      const uid = d.uid;
      const timestamp = new Date(d.timestamp);

      if (isNaN(timestamp)) continue;

      // skip weekend
      const day = timestamp.getDay();
      if (day === 0 || day === 6) continue;

      // cari siswa
      const siswa = await SiswaPpdb.findOne({
        where: { no_rfid: uid }
      });

      if (!siswa) continue;

      // range 1 hari
      const startDay = new Date(timestamp);
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date(timestamp);
      endDay.setHours(23, 59, 59, 999);

      // cek duplikat
      const sudahAda = await AbsenHarianSiswa.findOne({
        where: {
          id_siswa: siswa.id_siswa,
          waktu: {
            [Op.between]: [startDay, endDay]
          }
        }
      });

      if (sudahAda) continue;

      // simpan
      await AbsenHarianSiswa.create({
        id_siswa: siswa.id_siswa,
        status: "0",
        waktu: timestamp
      });
    }

    // 🔥 clear data di mesin
    try {
      await fetch(`http://${ip}/clear/${mesin}`);
    } catch (err) {
      console.log("Gagal clear mesin:", err.message);
    }

    return res.json({
      message: "Data berhasil ditarik",
      total: rfidData.length
    });

  } catch (err) {
    return res.status(500).json({
      message: "Terjadi kesalahan server",
      error: err.message
    });
  }
};

module.exports = { deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, logRfid, tarik };