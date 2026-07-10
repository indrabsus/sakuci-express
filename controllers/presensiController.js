// controllers/rfidController.js
const { AbsenHarianSiswa, SiswaPpdb, SiswaBaru, KelasPpdb, Absen, User, DataUser, Role } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
require('dayjs/locale/id');

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

const absenGuru = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const data = await Absen.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'users',
          where: { id_role: 6 },
          include: [{ model: DataUser }]
        }
      ],
      order: [['waktu', 'DESC']]
    });

    return res.json({
      total: data.count,
      page,
      totalPage: Math.ceil(data.count / limit),
      data: data.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

const absenStaf = async (req, res) => {
  try {
    const { id_user } = req.params;
    const { bulan, tahun } = req.query;

    const where = { id_user };

    if (bulan && tahun) {
      const awal = dayjs(`${tahun}-${String(bulan).padStart(2, '0')}-01`).startOf('month');
      const akhir = awal.endOf('month');

      where.waktu = {
        [Op.between]: [awal.format('YYYY-MM-DD HH:mm:ss'), akhir.format('YYYY-MM-DD HH:mm:ss')],
      };
    }

    const data = await Absen.findAll({
      where,
      order: [['waktu', 'ASC']],
    });

    return res.json({
      status: 'success',
      total: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

const STATUS_IZIN_LABEL = { '1': 'dispen', '2': 'sakit', '3': 'izin' };
const BATAS_TERLAMBAT_MENIT = 6 * 60 + 31; // 06:31

const jamKeMenit = (jam) => {
  const [h, m] = jam.split(':').map(Number);
  return h * 60 + m;
};

const rekapKehadiran = async (req, res) => {
  try {
    const { uid_fp } = req.params;
    const { bulan, tahun } = req.query;

    if (!uid_fp || !bulan || !tahun) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter uid_fp, bulan, dan tahun wajib diisi.',
      });
    }

    const dataUser = await DataUser.findOne({
      where: { uid_fp },
      include: [{ model: User, as: 'user', include: [{ model: Role, as: 'role' }] }],
    });

    if (!dataUser || !dataUser.user) {
      return res.status(404).json({
        status: 'error',
        message: 'Staf dengan uid_fp tersebut tidak ditemukan.',
      });
    }

    const idUser = dataUser.user.id;
    const namaRole = dataUser.user.role?.nama_role || null;

    const awal = dayjs(`${tahun}-${String(bulan).padStart(2, '0')}-01`).startOf('month');
    const akhir = awal.endOf('month');

    const absen = await Absen.findAll({
      where: {
        id_user: idUser,
        waktu: {
          [Op.between]: [awal.format('YYYY-MM-DD HH:mm:ss'), akhir.format('YYYY-MM-DD HH:mm:ss')],
        },
      },
      order: [['waktu', 'ASC']],
      raw: true,
    });

    const byDate = {};
    absen.forEach((item) => {
      const key = item.waktu.slice(0, 10);
      byDate[key] = byDate[key] || [];
      byDate[key].push(item);
    });

    const rekap = [];
    const jumlahHari = awal.daysInMonth();

    for (let d = 1; d <= jumlahHari; d++) {
      const tgl = dayjs(`${tahun}-${String(bulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      const dow = tgl.day(); // 0 = Minggu, 6 = Sabtu

      if (dow === 0 || dow === 6) continue;

      const key = tgl.format('YYYY-MM-DD');
      const records = byDate[key] || [];
      const izin = records.find((r) => STATUS_IZIN_LABEL[r.status]);
      const catatan = records.find((r) => r.keterangan && String(r.keterangan).trim() !== '')?.keterangan || null;

      let jamDatang = null;
      let jamPulang = null;
      let status = 'tidak_ada_data';
      let terlambat = false;

      if (izin) {
        status = STATUS_IZIN_LABEL[izin.status];
      } else {
        const masuk = records.filter((r) => r.status === '0').sort((a, b) => a.waktu.localeCompare(b.waktu))[0];
        const keluar = records.filter((r) => r.status === '4').sort((a, b) => b.waktu.localeCompare(a.waktu))[0];

        if (masuk) {
          jamDatang = masuk.waktu.slice(11, 16);
          terlambat = jamKeMenit(jamDatang) > BATAS_TERLAMBAT_MENIT;
        }
        if (keluar) jamPulang = keluar.waktu.slice(11, 16);

        status = masuk || keluar ? 'hadir' : 'tidak_ada_data';
      }

      rekap.push({
        tanggal: key,
        hari: tgl.locale('id').format('dddd'),
        status,
        jam_datang: jamDatang,
        jam_pulang: jamPulang,
        terlambat,
        keterangan: catatan,
      });
    }

    return res.json({
      status: 'success',
      uid_fp,
      id_user: idUser,
      nama_lengkap: dataUser.nama_lengkap,
      role: namaRole,
      bulan: Number(bulan),
      tahun: Number(tahun),
      data: rekap,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan server',
      error: error.message,
    });
  }
};

module.exports = { deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, logRfid, tarik, absenGuru, absenStaf, rekapKehadiran };