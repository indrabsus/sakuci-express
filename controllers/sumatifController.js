const {Sumatif, MapelKelas, MataPelajaran, Kelas, Jurusan, SoalUjian, NilaiUjian, TampungSoal, Soal, KategoriSoal, Opsi} = require('../models'); // Pastikan path benar

const dataSumatif = async (req, res) => {
    try {
      const sumatif = await Sumatif.findAll({
        include:[{
            model: MapelKelas, as: 'mapel_kelas',
            where: { id_kelas: req.params.id },
            include:[{ model: Kelas, as: "kelas",
                include:[{ model: Jurusan, as: "jurusan" }]
            },{
            model: MataPelajaran, as: 'mata_pelajaran',
            attributes: ['id_mapel', 'nama_pelajaran'], // Pilih kolom yang ingin diambil
          }],
        },{
            model: SoalUjian, as: "soal_ujian"
        }]
       
      }); // Mengambil semua data dari tabel siswa_ppdb
      res.status(200).json({
        status: 'success',
        message: 'Data berhasil diambil.',
        data: sumatif,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data.',
        error: error.message,
      });
    }
  }

  const jawabSoal = async (req, res) => {
    try {
      const { id_sumatif, id_user_siswa, jawaban_siswa } = req.body;
  
      // Cek apakah data sudah ada
      const existingAnswer = await NilaiUjian.findOne({
        where: {
          id_sumatif,
          id_user_siswa,
        },
      });
  
      if (existingAnswer) {
        // Jika jawaban sudah ada, update
        let existingJawaban = {};
        try {
          existingJawaban = JSON.parse(existingAnswer.jawaban_siswa) || {};
        } catch (err) {
          existingJawaban = {};
        }
  
        // Gabungkan jawaban lama dan baru
        const newJawaban = jawaban_siswa || {};
        const mergedJawaban = { ...existingJawaban, ...newJawaban };
  
        // Update data di database
        existingAnswer.jawaban_siswa = JSON.stringify(mergedJawaban);
        await existingAnswer.save();
  
        return res.status(200).json({
          data: existingAnswer,
          status: 200,
          message: 'Jawaban berhasil diperbarui',
        });
      }
  
      // Simpan data baru jika belum ada
      const newAnswer = await NilaiUjian.create({
        id_sumatif,
        id_user_siswa,
        jawaban_siswa: JSON.stringify(jawaban_siswa || {}),
      });
  
      return res.status(201).json({
        data: newAnswer,
        status: 201,
        message: 'Jawaban berhasil disimpan',
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  const getJawaban = async (req, res) => {
    try {
      const { id_sumatif, id_user_siswa } = req.params;
  
      // Ambil data jawaban dari tabel NilaiUjian
      const jawaban = await NilaiUjian.findOne({
        where: {
          id_sumatif,
          id_user_siswa,
        },
      });
  
      if (!jawaban) {
        return res.status(404).json({
          message: 'Jawaban tidak ditemukan',
          jawaban_siswa: null,
        });
      }
  
      return res.status(200).json({
        message: 'Jawaban berhasil diambil',
        jawaban_siswa: jawaban.jawaban_siswa, // Pastikan kolom ini benar di database
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengambil jawaban',
        error: error.message,
      });
    }
  }

  const fetchSumatif = async (req, res) => {
    try {
      const { id_sumatif } = req.params;
  
      // Cari data sumatif berdasarkan id_sumatif
      const data = await Sumatif.findOne({
        where: {
          id_sumatif,
        },
      });
  
      return res.status(200).json({
        data,
        status: 200,
        message: 'success',
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  const selesai = async (req, res) => {
    try {
      const { id_sumatif, id_user_siswa } = req.params;
  
      // Update kolom 'selesai' menjadi true
      const data = await NilaiUjian.update(
        { selesai: true },
        {
          where: {
            id_sumatif,
            id_user_siswa,
          },
        }
      );
  
      return res.status(200).json({
        status: 200,
        message: 'success',
        data: data
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  const cekUjian = async (req, res) => {
    try {
      const { id_sumatif, id_user } = req.params;
  
      // Cari data NilaiUjian berdasarkan id_sumatif dan id_user_siswa
      const cek = await NilaiUjian.findOne({
        where: {
          id_sumatif,
          id_user_siswa: id_user,
        },
      });
  
      return res.status(200).json({
        data: cek,
        status: 200,
        message: 'success',
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  const tampungSoal = async (req, res) => {
    try {
      const { id_soalujian } = req.params;
  
      // Query data dengan left join menggunakan Sequelize
      const data = await TampungSoal.findAll({
        where: { id_soalujian },
        include: [
          {
            model: Soal,
            as: 'soal', // Alias harus sesuai dengan yang didefinisikan dalam relasi Sequelize
          },
        ],
      });
  
      return res.status(200).json({
        data: data,
        status: 200,
        message: 'success',
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  const opsiSoal = async (req, res) => {
    try {
      const { id_soal } = req.params;
  
      // Perform the query using Sequelize's `leftJoin` (or `include` in Sequelize)
      const data = await Opsi.findAll({
        where: { id_soal },
        include: [
          {
            model: Soal,
            as: 'soal', // Make sure alias matches the relationship in your models
            required: true,
          },
        ],
      });
  
      // Shuffle the results
      const shuffledData = data.sort(() => Math.random() - 0.5);
  
      return res.status(200).json({
        data: shuffledData,
        status: 200,
        message: 'success',
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: 'Terjadi kesalahan pada server',
        error: error.message,
      });
    }
  }

  module.exports = { dataSumatif, getJawaban, fetchSumatif, selesai, cekUjian, tampungSoal, opsiSoal, jawabSoal };