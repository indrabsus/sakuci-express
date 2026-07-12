// controllers/rfidController.js
const { AbsenHarianSiswa, SiswaPpdb, SiswaBaru, KelasPpdb, RiwayatKelas, Absen, User, DataUser, Role } = require('../models');
const { Op, fn, col } = require('sequelize');
const dayjs = require('dayjs');
require('dayjs/locale/id');

const BATAS_ON_TIME_MENIT = 6 * 60 + 30; // 06:30
const BATAS_TOLERANSI_MENIT = 6 * 60 + 45; // 06:45
const IZIN_LABEL = { '1': 'dispen', '2': 'sakit', '3': 'izin' };

// Klasifikasi jam datang siswa: on_time (<=06:30), toleransi (06:30-06:45), terlambat (>06:45)
const klasifikasiJamMasuk = (waktu) => {
  const t = dayjs(waktu);
  const menit = t.hour() * 60 + t.minute();

  if (menit <= BATAS_ON_TIME_MENIT) {
    return { kategori: 'on_time', keterlambatan_menit: null };
  }
  if (menit <= BATAS_TOLERANSI_MENIT) {
    return { kategori: 'toleransi', keterlambatan_menit: null };
  }
  return { kategori: 'terlambat', keterlambatan_menit: menit - BATAS_TOLERANSI_MENIT };
};

const presensiHarian = async (req, res) => {
  try {
    const { kelas } = req.params;
    const { tanggal, status, tahun_ajaran } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    } else if (!tanggal) {
      // perilaku lama: default hanya status '0' kalau tidak ada filter tanggal/status
      whereClause.status = '0';
    }

    if (tanggal) {
      const awal = dayjs(tanggal).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const akhir = dayjs(tanggal).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      whereClause.waktu = { [Op.between]: [awal, akhir] };
    }

    // Kelas siswa diambil dari riwayat_kelas (bukan siswa_baru/kelas_ppdb), untuk tahun ajaran tertentu
    let tahunAktif = tahun_ajaran;
    if (!tahunAktif) {
      const maxTahun = await RiwayatKelas.findOne({
        attributes: [[fn('MAX', col('tahun_ajaran')), 'tahun_ajaran']],
        raw: true,
      });
      tahunAktif = maxTahun?.tahun_ajaran || null;
    }

    // nama_kelas tidak unik lintas tingkat (mis. "PPLG 1" ada di tingkat 11 & 12),
    // jadi parameter kelas dikirim sebagai "tingkat|nama_kelas"
    let tingkatFilter, namaKelasFilter;
    if (kelas) {
      const parts = kelas.split('|');
      [tingkatFilter, namaKelasFilter] = parts.length === 2 ? parts : [undefined, kelas];
    }

    const riwayatWhere = {};
    if (tahunAktif) riwayatWhere.tahun_ajaran = tahunAktif;
    if (namaKelasFilter) riwayatWhere.nama_kelas = namaKelasFilter;
    if (tingkatFilter) riwayatWhere.tingkat = tingkatFilter;

    const data = await AbsenHarianSiswa.findAll({
      include: [
        {
          model: SiswaPpdb,
          as: 'siswa_ppdb',
          required: !!kelas,
          include: [
            {
              model: RiwayatKelas,
              as: 'riwayat_kelas',
              where: Object.keys(riwayatWhere).length ? riwayatWhere : undefined,
              required: !!kelas,
            },
          ],
        },
      ],
      where: whereClause,
      order: [['waktu', 'DESC']]
    });

    const dataJson = data.map((row) => {
      const json = row.toJSON();
      if (json.status === '0') {
        const { kategori, keterlambatan_menit } = klasifikasiJamMasuk(json.waktu);
        json.kategori_datang = kategori;
        json.keterlambatan_menit = keterlambatan_menit;
      }
      return json;
    });

    return res.json(dataJson);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

const rekapHarianSiswa = async (req, res) => {
  try {
    const { tanggal, kelas } = req.query;
    let { tahun_ajaran } = req.query;

    if (!tanggal) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter tanggal wajib diisi.',
      });
    }
    if (!kelas) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter kelas wajib diisi.',
      });
    }

    if (!tahun_ajaran) {
      const maxTahun = await RiwayatKelas.findOne({
        attributes: [[fn('MAX', col('tahun_ajaran')), 'tahun_ajaran']],
        raw: true,
      });
      tahun_ajaran = maxTahun?.tahun_ajaran || null;
    }

    const parts = kelas.split('|');
    const [tingkat, namaKelas] = parts.length === 2 ? parts : [undefined, kelas];

    const riwayatWhere = { nama_kelas: namaKelas };
    if (tahun_ajaran) riwayatWhere.tahun_ajaran = tahun_ajaran;
    if (tingkat) riwayatWhere.tingkat = tingkat;

    const awal = dayjs(tanggal).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const akhir = dayjs(tanggal).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const siswaList = await SiswaPpdb.findAll({
      attributes: ['id_siswa', 'nama_lengkap'],
      include: [
        {
          model: RiwayatKelas,
          as: 'riwayat_kelas',
          where: riwayatWhere,
          required: true,
        },
        {
          model: AbsenHarianSiswa,
          as: 'absen_harian_siswa',
          where: { waktu: { [Op.between]: [awal, akhir] } },
          required: false,
        },
      ],
      order: [['nama_lengkap', 'ASC']],
    });

    const data = siswaList.map((s) => {
      const json = s.toJSON();
      const kelasInfo = json.riwayat_kelas?.[0] || null;
      const records = json.absen_harian_siswa || [];
      const masuk = records.find((r) => r.status === '0');
      const izin = records.find((r) => IZIN_LABEL[r.status]);

      let kategori = 'belum_absen';
      let keterlambatan_menit = null;
      let jam = null;

      if (masuk) {
        jam = masuk.waktu.slice(11, 16);
        const klas = klasifikasiJamMasuk(masuk.waktu);
        kategori = klas.kategori;
        keterlambatan_menit = klas.keterlambatan_menit;
      } else if (izin) {
        kategori = IZIN_LABEL[izin.status];
      }

      return {
        id_siswa: json.id_siswa,
        nama_lengkap: json.nama_lengkap,
        tingkat: kelasInfo?.tingkat || null,
        nama_kelas: kelasInfo?.nama_kelas || null,
        kategori,
        jam,
        keterlambatan_menit,
      };
    });

    return res.json({
      status: 'success',
      tanggal,
      tahun_ajaran,
      kelas: { tingkat, nama_kelas: namaKelas },
      total: data.length,
      data,
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
    const { waktu, status } = req.body;

    try {
        const data = await AbsenHarianSiswa.findByPk(id_harian);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        // update data
        await data.update({
            ...(waktu !== undefined && { waktu }),
            ...(status !== undefined && { status }),
        });

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

const createHarian = async (req, res) => {
  try {
    const { id_siswa, status, waktu } = req.body;

    if (!id_siswa || !status || !waktu) {
      return res.status(400).json({
        status: 'error',
        message: 'id_siswa, status, dan waktu wajib diisi.',
      });
    }

    const startDay = dayjs(waktu).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endDay = dayjs(waktu).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    const sudahAda = await AbsenHarianSiswa.findOne({
      where: { id_siswa, waktu: { [Op.between]: [startDay, endDay] } },
    });

    if (sudahAda) {
      return res.status(400).json({
        status: 'error',
        message: 'Siswa ini sudah memiliki data absen pada tanggal tersebut.',
      });
    }

    const data = await AbsenHarianSiswa.create({ id_siswa, status, waktu });

    return res.status(201).json({
      status: 'success',
      message: 'Absensi siswa berhasil ditambahkan.',
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

const listAbsenStaf = (idRole) => async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 500);
    const offset = (page - 1) * limit;
    const { tanggal, search } = req.query;

    const whereAbsen = {};
    if (tanggal) {
      const awal = dayjs(tanggal).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const akhir = dayjs(tanggal).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      whereAbsen.waktu = { [Op.between]: [awal, akhir] };
    }

    const data = await Absen.findAndCountAll({
      where: whereAbsen,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'users',
          where: { id_role: idRole },
          include: [{
            model: DataUser,
            ...(search ? { where: { nama_lengkap: { [Op.like]: `%${search}%` } } } : {}),
          }]
        }
      ],
      order: [['waktu', 'DESC']],
      distinct: true,
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

const absenGuru = listAbsenStaf(6);
const absenTendik = listAbsenStaf(7);

const createAbsenGuru = async (req, res) => {
  try {
    const { id_user, status, waktu, keterangan } = req.body;

    if (!id_user || !status || !waktu) {
      return res.status(400).json({
        status: 'error',
        message: 'id_user, status, dan waktu wajib diisi.',
      });
    }

    if (req.user?.role === 'manajemen' && status === '0') {
      return res.status(403).json({
        status: 'error',
        message: 'Piket tidak dapat menambahkan status Masuk/Hadir. Hanya Sakit, Izin, Dispen, atau Pulang.',
      });
    }

    const data = await Absen.create({
      id_user,
      status,
      waktu,
      keterangan: keterangan || null,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Absensi guru berhasil ditambahkan.',
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

const updateAbsenGuru = async (req, res) => {
  try {
    const { id_absen } = req.params;
    const { status, waktu, keterangan } = req.body;

    const data = await Absen.findByPk(id_absen);
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Data tidak ditemukan.',
      });
    }

    await data.update({
      ...(status !== undefined && { status }),
      ...(waktu !== undefined && { waktu }),
      ...(keterangan !== undefined && { keterangan }),
    });

    return res.json({
      status: 'success',
      message: 'Absensi guru berhasil diperbarui.',
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

const deleteAbsenGuru = async (req, res) => {
  try {
    const { id_absen } = req.params;

    const data = await Absen.findByPk(id_absen);
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: 'Data tidak ditemukan.',
      });
    }

    await data.destroy();

    return res.json({
      status: 'success',
      message: 'Absensi guru berhasil dihapus.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: error.message,
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

const BATAS_ON_TIME_GURU_MENIT = 6 * 60 + 30; // 06:30, ketat < (bukan <=)

const rekapBulananStaf = (idRole) => async (req, res) => {
  try {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({
        status: 'error',
        message: 'Parameter bulan dan tahun wajib diisi.',
      });
    }

    const awal = dayjs(`${tahun}-${String(bulan).padStart(2, '0')}-01`).startOf('month');
    const akhir = awal.endOf('month');

    // hanya hari kerja (Senin-Jumat)
    const hariKerja = [];
    const jumlahHari = awal.daysInMonth();
    for (let d = 1; d <= jumlahHari; d++) {
      const tgl = dayjs(`${tahun}-${String(bulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      const dow = tgl.day();
      if (dow === 0 || dow === 6) continue;
      hariKerja.push(tgl.format('YYYY-MM-DD'));
    }

    const stafList = await User.findAll({
      where: { id_role: idRole },
      include: [{ model: DataUser }],
      order: [[DataUser, 'nama_lengkap', 'ASC']],
    });

    const stafIds = stafList.map((g) => g.id);

    const absenList = await Absen.findAll({
      where: {
        id_user: { [Op.in]: stafIds },
        waktu: {
          [Op.between]: [awal.format('YYYY-MM-DD HH:mm:ss'), akhir.format('YYYY-MM-DD HH:mm:ss')],
        },
      },
      raw: true,
    });

    const byUser = {};
    absenList.forEach((a) => {
      const tgl = a.waktu.slice(0, 10);
      byUser[a.id_user] = byUser[a.id_user] || {};
      byUser[a.id_user][tgl] = byUser[a.id_user][tgl] || [];
      byUser[a.id_user][tgl].push(a);
    });

    const data = stafList.map((g) => {
      const records = byUser[g.id] || {};
      const rekap = {};

      hariKerja.forEach((tgl) => {
        const items = records[tgl] || [];
        const masuk = items.filter((r) => r.status === '0').sort((a, b) => a.waktu.localeCompare(b.waktu))[0];
        const keluar = items.filter((r) => r.status === '4').sort((a, b) => b.waktu.localeCompare(a.waktu))[0];
        const izin = items.find((r) => r.status === '3');
        const sakit = items.find((r) => r.status === '2');
        const dispen = items.find((r) => r.status === '1');

        let kategori = null;

        if (masuk) {
          const jamDatang = dayjs(masuk.waktu);
          const onTime = jamDatang.hour() * 60 + jamDatang.minute() < BATAS_ON_TIME_GURU_MENIT;

          if (keluar) {
            kategori = onTime ? 'lengkap_ontime' : 'lengkap_terlambat';
          } else {
            kategori = onTime ? 'belum_pulang_ontime' : 'belum_pulang_terlambat';
          }
        } else if (izin) {
          kategori = 'izin';
        } else if (sakit) {
          kategori = 'sakit';
        } else if (dispen) {
          kategori = 'dispen';
        }

        rekap[tgl] = kategori;
      });

      return {
        id_user: g.id,
        nama_lengkap: g.DataUser?.nama_lengkap || g.username,
        rekap,
      };
    });

    return res.json({
      status: 'success',
      bulan: Number(bulan),
      tahun: Number(tahun),
      hari: hariKerja,
      data,
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

const rekapBulananGuru = rekapBulananStaf(6);
const rekapBulananTendik = rekapBulananStaf(7);

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

module.exports = {
  deleteHarian, updateHarian, detailHarian, presensiHarian, cekHarian, createHarian,
  logRfid, tarik, absenGuru, absenTendik, absenStaf, rekapKehadiran, rekapHarianSiswa,
  rekapBulananGuru, rekapBulananTendik,
  createAbsenGuru, updateAbsenGuru, deleteAbsenGuru,
};