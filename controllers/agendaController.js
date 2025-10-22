const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {MapelKelas, MataPelajaran, DataSiswa, Kelas, Jurusan, 
  User, Materi, AbsenSiswa, Agenda, DataUser, KelasPpdb, Jadwal} = require('../models');
const moment = require('moment-timezone');
const axios = require("axios");

const dataAgenda = async (req, res) => {
  try {
    const { id_agenda } = req.params;

    const queryOptions = {
      include: [
        { model: DataUser, as: "guru" },
        { model: MataPelajaran, as: "mapel" },
        { model: KelasPpdb, as: "kelas" }
      ],
      order: [["created_at", "DESC"]]
    };

    let data;

    if (id_agenda) {
      // ambil 1 data
      data = await Agenda.findOne({
        where: { id_agenda },
        ...queryOptions,
        
      });
    } else {
      // ambil semua data
      data = await Agenda.findAll(queryOptions);
    }

    if (data) {
      return res.status(200).json({
        status: "success",
        message: id_agenda ? "Data agenda ditemukan" : "Semua data agenda berhasil diambil",
        data,
      });
    }

    return res.status(404).json({
      status: "error",
      message: id_agenda ? "Agenda tidak ditemukan" : "Belum ada data agenda",
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const hitungAgenda = async (req, res) => {
  try {
    const { id_data, bulan, tahun } = req.params;

    // Ambil semua data agenda berdasarkan id_data
    const agendaList = await Agenda.findAll({
      where: { id_data },
      raw: true,
    });

    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, tugas: 0 };
    const dayStatus = new Map();

    agendaList.forEach((item) => {
      if (!item.created_at || !item.status) return; // antisipasi data kosong

      // Tambahkan offset GMT+7 untuk waktu Indonesia
      const localDate = new Date(new Date(item.created_at).getTime() + 7 * 60 * 60 * 1000);

      const y = localDate.getFullYear();
      const m = localDate.getMonth() + 1;

      // Filter data sesuai bulan dan tahun yang diminta
      if (y === parseInt(tahun) && m === parseInt(bulan)) {
        const dateKey = localDate.toISOString().split("T")[0];

        // Simpan status pertama yang muncul di hari itu (hindari duplikasi tanggal)
        if (!dayStatus.has(dateKey)) {
          dayStatus.set(dateKey, item.status.toLowerCase().trim());
        }
      }
    });

    // Hitung total per status
    for (const status of dayStatus.values()) {
      if (summary[status] !== undefined) {
        summary[status]++;
      }
    }

    return res.status(200).json(summary);

  } catch (error) {
    console.error("Error hitungAgenda:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const dataJadwal = async (req, res) => {
  try {
    const { id_data, hari, jam_ke } = req.params;

    
      data = await Jadwal.findOne({
        where: { id_data, hari, jam_ke },
      });

    if (data) {
      return res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data,
      });
    }

    return res.status(404).json({
      status: "error",
      message: "Belum ada data",
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const hariAgenda = async (req, res) => {
  try {
    // Waktu sekarang dalam zona waktu lokal (WIB)
    const offsetMs = 7 * 60 * 60 * 1000; // offset +7 jam
    const local = new Date(Date.now() + offsetMs);
    const today = local.toISOString().split("T")[0];

    const data = await Agenda.findAll({
      where: where(fn("DATE", col("tanggal_agenda")), today),
    });

    res.json({ status: "success", data });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
};

const hariJadwal = async (req, res) => {
  try {
    const { hari } = req.params;

    
      data = await Jadwal.findAll({
        include: [
          { model: DataUser, as: "guru" },
          { model: MataPelajaran, as: "mapel" },
          { model: KelasPpdb, as: "kelas" }
        ],
        where: { hari },
        order: [["jam_ke", "ASC"]]
      });

    if (data) {
      return res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data,
      });
    }

    return res.status(404).json({
      status: "error",
      message: "Belum ada data",
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const jadwalList = async (req, res) => {
  try {
    const { id_jadwal } = req.params; // ambil dari parameter URL kalau ada

    let data;

    if (id_jadwal) {
      // kalau ada id_jadwal, ambil satu data saja
      data = await Jadwal.findOne({
        where: { id_jadwal },
        include: [
          { model: DataUser, as: "guru" },
          { model: MataPelajaran, as: "mapel" },
          { model: KelasPpdb, as: "kelas" },
        ],
      });

      if (!data) {
        return res.status(404).json({
          status: "error",
          message: "Data dengan ID tersebut tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data,
      });
    }

    // kalau tidak ada id_jadwal, ambil semua data
    data = await Jadwal.findAll({
      include: [
        { model: DataUser, as: "guru" },
        { model: MataPelajaran, as: "mapel" },
        { model: KelasPpdb, as: "kelas" },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Belum ada data",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Data ditemukan",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const createAgenda = async (req, res) => {
  const {
    id_mapel,
    id_data,
    id_kelas,
    tanggal_agenda,
    materi,
    tingkat,
    semester,
    tahun_pelajaran,
    penilaian,
    jamke,
    status,
    no_hp,
  } = req.body;

  try {
    const today = moment().format("YYYY-MM-DD");

    // cek duplikat
    const duplicate = await Agenda.findOne({
      where: {
        id_kelas,
        jamke,
        id_data,
        id_mapel,
        tahun_pelajaran,
        created_at: {
          [Op.gte]: `${today} 00:00:00`,
          [Op.lte]: `${today} 23:59:59`,
        },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        status: "error",
        message: "Agenda dengan kelas dan jam yang sama sudah ada di hari ini!",
      });
    }

    // buat agenda baru
    const data = await Agenda.create({
      id_mapel,
      tanggal_agenda,
      id_data,
      id_kelas,
      materi,
      tingkat,
      semester,
      tahun_pelajaran,
      penilaian,
      jamke,
      status,
    });

    // cari user
    const dataUser = await DataUser.findOne({ where: { id_data } });

    // normalisasi nomor hp jika ada
    let nomorTujuan = null;
    if (dataUser && no_hp) {
      const normalized = normalizePhoneNumber(no_hp);
      nomorTujuan = normalized;

      if (dataUser.no_hp !== normalized) {
        await dataUser.update({ no_hp: normalized });
      }
    }

    // 🔹 kirim respon sukses duluan
    res.status(200).json({
      status: "success",
      message: "Berhasil menambahkan data!",
      data,
    });

    // 🔹 kirim WA di background (tanpa menunggu)
    if (nomorTujuan) {
      (async () => {
        try {
          const waRes = await axios.post(`${process.env.API_WA}`, {
            nomor: nomorTujuan,
            pesan: `Ini adalah link Absen: ${process.env.API_LARAVEL}/siswakelas/${data.id_agenda}`,
          });
          console.log("WA Response:", waRes.data);
        } catch (waError) {
          console.error("Gagal kirim WA:", waError.response?.data || waError.message);
        }
      })();
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "gagal",
      message: "Gagal menambahkan data!",
      error: error.message,
    });
  }
};

const createJadwal = async (req, res) => {
  const {
    id_data,
    id_mapel,
    id_kelas,
    jam_ke,
    sampai_ke,
    hari,
    tahun_pelajaran
  } = req.body;

  try {
    

    // cek apakah sudah ada agenda di tanggal yg sama, kelas sama, jamke sama
    const duplicate = await Jadwal.findOne({
      where: {
        id_data,
        jam_ke,
        id_kelas,
        id_mapel,
        tahun_pelajaran
      },
    });

    if (duplicate) {
      const updateJadwal = await Jadwal.update(
        {
          sampai_ke,
        },
        {
          where: {
            id_data,
            jam_ke,
            id_kelas,
            id_mapel,
            tahun_pelajaran
          },
        }
      )
      return res.status(200).json({
        status: "update success",
        message: "Jadwal sudah terupdate!",
      });
    }

    // kalau tidak ada duplikat, buat agenda baru
    const data = await Jadwal.create({
      id_data,
    id_mapel,
    id_kelas,
    jam_ke,
    sampai_ke,
    hari,
    tahun_pelajaran
    });

    res.status(200).json({
      status: "success",
      message: "berhasil menambahkan data!",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "gagal",
      message: "gagal mengambil data!",
      error: error.message,
    });
  }
};

const updateJadwal = async (req, res) => {
  const { id_jadwal } = req.params; // ambil ID dari URL
  const {
    id_data,
    id_mapel,
    id_kelas,
    jam_ke,
    sampai_ke,
    hari,
    tahun_pelajaran
  } = req.body;

  try {
    // cek apakah data dengan id_jadwal tersebut ada
    const jadwal = await Jadwal.findOne({ where: { id_jadwal } });

    if (!jadwal) {
      return res.status(404).json({
        status: "error",
        message: "Data jadwal tidak ditemukan",
      });
    }

    // update data jadwal
    await jadwal.update({
      id_data,
      id_mapel,
      id_kelas,
      jam_ke,
      sampai_ke,
      hari,
      tahun_pelajaran
    });

    return res.status(200).json({
      status: "success",
      message: "Data jadwal berhasil diperbarui",
      data: jadwal,
    });

  } catch (error) {
    console.error("Error update jadwal:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal memperbarui data jadwal",
      error: error.message,
    });
  }
};

function normalizePhoneNumber(no_hp) {
  if (!no_hp) return null;

  // hapus semua spasi, strip, titik
  let cleaned = no_hp.replace(/[\s.-]/g, "");

  // kalau diawali 0 → ganti jadi 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // kalau sudah diawali 62 → biarkan
  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  // kalau tidak ada 0 atau 62 → fallback, tambahkan 62
  return "62" + cleaned;
}

const deleteAgenda = async (req, res) => {
    const { id_agenda } = req.params;

    try {
        const data = await Agenda.findByPk(id_agenda);

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



// Fungsi AGENDA LAMA
const isiAgenda = async (req, res) => {
  try {
    const { username } = req.params;
    const currentDay = new Date().getDay() || 7;

    const data = await MapelKelas.findAll({
      include: [
        { model: MataPelajaran, as: 'mata_pelajaran' },
        { 
          model: Kelas, 
          as: 'kelas', 
          include: [{ model: Jurusan, as: 'jurusan' }] 
        },
        { 
          model: User, 
          as: 'user', 
          where: { username },
          required: true,
        },
      ],
      where: literal(`FIND_IN_SET(${currentDay}, hari) > 0`),
    });

    if (data.length > 0) {
      return res.status(200).json({ data, status: 200 });
    }
    return res.status(404).json({ message: 'Data tidak ditemukan' });
  } catch (error) {
    console.error('Error isiAgenda:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Fungsi cekUsername
const cekUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const data = await User.findOne({
      where: { username, id_role: 6 },
    });

    if (data) {
      return res.status(200).json({ data, status: 200 });
    }
    return res.status(404).json({ message: 'Data tidak ditemukan' });
  } catch (error) {
    console.error('Error cekUsername:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Fungsi getMateri
const getMateri = async (req, res) => {
  try {
    const { username } = req.params;
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const data = await Materi.findAll({
      include: [
        {
          model: MapelKelas,
          as: 'mapel_kelas',
          include: [{ model: User, as: 'user', where: { username }, required: true }],
        },
      ],
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
    });

    return res.status(200).json({ data, status: 200 });
  } catch (error) {
    console.error('Error getMateri:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Fungsi prosesAgenda
const prosesAgenda = async (req, res) => {
  try {
    const { materi, tingkat, id_mapelkelas, tahun } = req.params;

    // Check if id_mapelkelas is provided
    
    const currentMonth = new Date().getMonth() + 1;
    const semester = [7, 8, 9, 10, 11, 12].includes(currentMonth) ? 'ganjil' : 'genap';

    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const count = await Materi.count({
      where: {
        id_mapelkelas,
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
    });
    
    if (count > 0) {
      await Materi.update(
        { materi },
        {
          where: { id_mapelkelas, created_at: { [Op.between]: [startOfDay, endOfDay] } },
        }
      );
      return res.status(200).json({ message: 'Data berhasil diperbarui' });
    }

    await Materi.create({
      id_mapelkelas,
      tahun_pelajaran: tahun,
      keterangan: null,
      materi,
      semester,
      penilaian: 'n',
      tingkatan: tingkat,
    });

    return res.status(200).json({ message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error prosesAgenda:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};


// Fungsi absenListSiswa
const absenListSiswa = async (req, res) => {
  const { id_materi } = req.params;

  try {
    // Melakukan query dengan left join menggunakan Sequelize
    const data = await Materi.findAll({
      where: { id_materi },
      include: [{
        model: MapelKelas, as: 'mapel_kelas',
        include: [{
          model: Kelas, as: "kelas",
          include: [{
            model: Jurusan, as: "jurusan"
          }, {
            model: DataSiswa, as: "data_siswa",
            include: [{
              model: User, as: "user",
              where: { acc: "y" }
            }],
            order: [['nama_lengkap', 'ASC']]  // Urutkan berdasarkan nama_lengkap di level DataSiswa
          }]
        }, {
          model: MataPelajaran, as: 'mata_pelajaran',
        }]
      }],
      order: [[
        { model: MapelKelas, as: 'mapel_kelas' },  // Pastikan model mapel_kelas ada
        { model: Kelas, as: 'kelas' },  // Pastikan kelas diurutkan jika perlu
        { model: DataSiswa, as: 'data_siswa' },
        'nama_lengkap',  // Urutkan berdasarkan nama_lengkap
        'ASC'  // Ascending
      ]]
    });

    return res.status(200).json({
      data,
      status: 200
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error occurred while fetching data',
      error: error.message,
    });
  }
};

async function prosesAbsen(req, res) {
    const { id_user, id_materi, waktu_agenda, keterangan } = req.params;
    
    const waktuku = moment.utc(waktu_agenda).tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    
    try {
        // Cari data yang sudah ada berdasarkan kondisi
        let existingData = await AbsenSiswa.findOne({
            where: {
                id_materi: id_materi,
                id_user: id_user,
                waktu: waktuku,
            },
        });

        if (existingData) {
            // Update hanya jika keterangan berbeda
            if (existingData.keterangan !== keterangan) {
                await existingData.update({ keterangan: keterangan });
            }
        } else {
            // Buat data baru jika tidak ditemukan
            existingData = await AbsenSiswa.create({
                id_materi: id_materi,
                id_user: id_user,
                waktu: waktuku,
                keterangan: keterangan,
            });
        }

        // Kirim respon JSON
        return res.status(200).json({
            data: existingData,
            status: 200,
        });
    } catch (error) {
        // Tangani error
        console.error(error);
        return res.status(500).json({
            message: waktu_agenda,
            status: 500,
        });
    }
}

const deleteJadwal = async (req, res) => {
  const { id_jadwal } = req.params;

  try {
    const jadwal = await Jadwal.findByPk(id_jadwal);

    if (!jadwal) {
      return res.status(404).json({
        status: "error",
        message: "Data jadwal tidak ditemukan!",
      });
    }

    await jadwal.destroy();

    res.status(200).json({
      status: "success",
      message: "Data jadwal berhasil dihapus!",
    });
  } catch (error) {
    console.error("Error delete jadwal:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal menghapus data jadwal!",
      error: error.message,
    });
  }
};

module.exports = { isiAgenda, cekUsername, getMateri, hariAgenda,
  prosesAgenda, absenListSiswa, prosesAbsen, dataAgenda, 
  deleteAgenda, createAgenda, dataJadwal, createJadwal, jadwalList,
updateJadwal, deleteJadwal, hitungAgenda, hariJadwal };
