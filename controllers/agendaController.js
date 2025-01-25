const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {MapelKelas, MataPelajaran, DataSiswa, Kelas, Jurusan, User, Materi} = require('../models');

// Fungsi isiAgenda
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
    const { materi, tingkat, id_mapelkelas } = req.body;
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


module.exports = { isiAgenda, cekUsername, getMateri, prosesAgenda, absenListSiswa };
