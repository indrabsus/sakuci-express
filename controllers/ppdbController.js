const {SiswaPpdb, JurusanPpdb, MasterPpdb, LogPpdb, KelasPpdb, SiswaBaru} = require('../models'); // Pastikan path benar
const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {axios, axiosInstance} = require('../config/axios');
const moment = require('moment');

const kelas = async (req, res) => {
    const {tahun} = req.params;
  try {
    const data = await KelasPpdb.findAll({
      include: [{ model: JurusanPpdb, as: 'jurusan_ppdb',required: true,
      
          include:[{
              model: MasterPpdb, as: 'master_ppdb',
              where: {tahun}
          }]
      }]
    });

    res.status(200).json({
      status: 'success',
      message: 'Data berhasil diambil.',
      data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    });
  }
};

const formatNoHp = (no_hp) => {
  // Hapus semua karakter yang tidak diperlukan (spasi, tanda minus, tanda plus)
  let formatted = no_hp.replace(/[^0-9]/g, '');

  // Jika nomor telepon diawali dengan '0', ganti dengan '62'
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.slice(1);
  } 
  // Jika nomor telepon diawali dengan '+62', hapus tanda '+'
  else if (formatted.startsWith('62') && formatted.charAt(0) === '0') {
    formatted = '62' + formatted.slice(1);
  }

  return formatted;
};

const logPpdb = async (req, res) => {
  try {
    const { tahun } = req.params; // Ambil tahun dari parameter URL

    if (!tahun || isNaN(tahun)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tahun tidak valid atau tidak diberikan.',
      });
    }

    const startDate = new Date(`${tahun}-01-01T00:00:00Z`);
    const endDate = new Date(`${tahun}-12-31T23:59:59Z`);

    const siswa = await LogPpdb.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['created_at', 'DESC']],
      include: [{
        model: SiswaPpdb, as: 'siswa_ppdb'
      }]
    });

    res.status(200).json({
      status: 'success',
      message: `Data siswa tahun ${tahun} berhasil diambil.`,
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


const dataSiswa = async (req, res) => {
    try {
        const {tahun, status} = req.params;
         const whereClause = { tahun};
    if (status) {
      whereClause.bayar_daftar = status; // Tambahkan status jika ada
    }
        const siswa = await SiswaPpdb.findAll({
            include: [{
                model: LogPpdb, as: 'log_ppdb'
            }],
            where: whereClause,
            order: [['created_at', 'DESC']], // Order by created_at ascending
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

const detailSiswa = async (req, res) => {
    try {
    const {id_siswa, tahun} = req.params;
      const siswa = await SiswaPpdb.findAll({
          include: [{
              model: LogPpdb, as: 'log_ppdb'
          }],
        where: { tahun, id_siswa: id_siswa },
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

  const regisSiswa = async (req, res) => {
    try {
      const {
        nama_lengkap,
        tempat_lahir,
        tanggal_lahir,
        jenkel,
        agama,
        alamat,
        nisn,
        nik_siswa,
        nama_ayah,
        nama_ibu,
        asal_sekolah,
        minat_jurusan1,
        minat_jurusan2,
        no_hp,
      } = req.body;
  
      // Format nomor HP
      const no_hpFormatted = formatNoHp(no_hp);
      const tahunSekarang = new Date().getFullYear();
  
      // Simpan data ke database
      const newSiswa = await SiswaPpdb.create({
        nama_lengkap,
        tempat_lahir,
        tanggal_lahir,
        jenkel,
        agama,
        alamat,
        nisn,
        nik_siswa,
        nama_ayah,
        nama_ibu,
        asal_sekolah,
        minat_jurusan1,
        minat_jurusan2,
        no_hp: no_hpFormatted,
        tahun: tahunSekarang,
        bayar_daftar: 'n',
      });
  
      // Kirim pesan notifikasi
      try {
        const kirimpesan = await axios.post(process.env.API_WA, {
          nomor: no_hpFormatted,
          pesan: `Terima Kasih ${nama_lengkap} telah mendaftar di SMK Sangkuriang 1 Cimahi.

Untuk tahap selanjutnya yaitu membayar Administrasi Pendaftaran Rp. 150.000, dapat hadir langsung ke Kampus SMK Sangkuriang 1 Cimahi melalui panitia PPDB atau Transfer ke No Rek.
BSI : 7207310063
a.n Yayasan Pendidikan Dayang Sumbi Jaya Lestari.

Mohon untuk konfirmasi ke salah satu nomor dibawah ini :
Pak Dwi : +62 856-2457-8718
Bu Ati : +62 822-9530-5320
Pa Anas : +62 812-5353-1933
Bu Minati : +62 878-2211-1349

Terima Kasih 
Panitia SPMB SMK Sangkuriang 1 Cimahi

Silakan ketik "hai" untuk informasi dari WhatsApp BOT.`,
        });
      const text = `Pemberitahuan, ada siswa baru mendaftar dengan nama ${nama_lengkap}, dan asal sekolah dari ${asal_sekolah}, no Whatsapp : https://wa.me/${no_hpFormatted}`;
      const tele = await axios.get(`https://api.telegram.org/bot${process.env.API_BOT_TELEGRAM}/sendMessage?chat_id=${process.env.CHAT_ID_TELEGRAM}&text=${text}`);
      } catch (notifError) {
        console.error('Gagal mengirim pesan:', notifError.response?.data || notifError.message);
      }
  
      // Berikan respons sukses
      return res.status(201).json({
        message: 'Pendaftaran berhasil!',
        data: newSiswa,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Terjadi kesalahan pada server!',
        error: error.message,
      });
    }
  }

  const jurusan = async (req, res) => {
    try {
   const tahunSekarang = new Date().getFullYear();
  const jurusanPpdb = await JurusanPpdb.findAll({
      include:[{
          model: MasterPpdb, as: 'master_ppdb',
          where:{
              tahun: tahunSekarang
          }
      }]
  })
   res.status(200).json({
     status: 'success',
     message: 'Data siswa berhasil diambil.',
     data: jurusanPpdb,
   });
 } catch (error) {
   res.status(500).json({
     status: 'error',
     message: 'Gagal mengambil data siswa.',
     error: error.message,
   });
 }
}

const bayarDaftar = async (req, res) => {
    const { jenis, id_siswa, petugas } = req.body;
    
    if (!jenis) {
        return res.status(400).json({ error: 'Jenis is required' });
    }

    try {
        const siswa = await SiswaPpdb.findOne({ where: { id_siswa } });
        if (!siswa) {
            return res.status(404).json({ error: 'Siswa not found' });
        }

        const noInvoice = `D-${jenis.toUpperCase()}-${moment().format('DDMMYYYYH')}${siswa.id_siswa}`;
        const cek = await LogPpdb.count({ where: { no_invoice: noInvoice } });
        
        if (cek < 1) {
            if (siswa.bayar_daftar === 'n') {
                const data = await MasterPpdb.findOne({ where: { tahun: moment().format('YYYY') } });
                
                if (data) {
                    await LogPpdb.create({
                        id_siswa: siswa.id_siswa,
                        nominal: data.daftar,
                        no_invoice: `D-${jenis.toUpperCase()}-${moment().format('DDMMYYYYH')}-${siswa.id_siswa.substring(0, 3)}`,
                        jenis: 'd',
                        petugas: petugas
                    });
                    
                    await SiswaPpdb.update({ bayar_daftar: 'y' }, { where: { id_siswa } });
                    return res.json({ message: 'Berhasil daftar!' });
                }
            }
        } else {
            return res.status(400).json({ error: 'Tunggu beberapa saat!' });
        }
    } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
}
}
const bayarPpdb = async (req, res) => {
  const { id_siswa, nom, jenis, petugas } = req.body;  // Mengambil data dari request body

  try {
      const nom2 = await LogPpdb.sum('nominal', {where:{"id_siswa":id_siswa, "jenis": "p"}})
    // 1. Cek apakah no_invoice sudah ada
    const noInvoice = `P-${jenis.toUpperCase()}-${moment().format('DDMMYYYYHH')}${id_siswa}`;
    const existingPayment = await LogPpdb.count({
      where: { no_invoice: noInvoice }
    });

    // 2. Ambil data MasterPpdb berdasarkan tahun
    const masterPpdb = await MasterPpdb.findOne({
      where: { tahun: moment().year() }
    });

    if (!masterPpdb) {
      return res.status(400).json({ message: 'Master data PPDB tidak ditemukan!' });
    }

    // 3. Total nominal yang dimasukkan
    const inputNow = nom + nom2;

    if (inputNow > masterPpdb.ppdb) {
      return res.status(400).json({ message: 'Melebihi jumlah nominal!' });
    }

    // 4. Jika no_invoice belum ada, simpan data
    if (existingPayment < 1) {
      const noInvoiceCreated = `P-${jenis.toUpperCase()}-${moment().format('DDMMYYYYHH')}-${id_siswa.substring(0, 3)}`;
      const tampung = await LogPpdb.create({
        id_siswa,
        nominal: nom,
        no_invoice: noInvoiceCreated,
        jenis: 'p',
        petugas
      });

      return res.status(200).json({ message: 'Berhasil membayar!', data: tampung });
    } else {
      return res.status(400).json({ message: 'Tunggu beberapa saat!' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan!' });
  }
}

const deleteLog = async (req, res) => {
    const { jenis, id_siswa, id_log } = req.body;
    
    try {
        if (jenis === 'd') {
            await SiswaPpdb.update({ bayar_daftar: 'n' }, { where: { id_siswa } });
        }
        
        await LogPpdb.destroy({ where: { id_log } });
        return res.json({ message: 'Data berhasil dihapus' });
    } catch (error) {
        console.error("Error deleting log:", error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

const postKelas = async (req, res) => {
    const { id_siswa, id_kelas } = req.body;

    try {
        // Cek apakah siswa sudah ada berdasarkan id_siswa saja
        let siswa = await SiswaBaru.findOne({ where: { id_siswa } });

        if (!siswa) {
            // Jika tidak ada, buat data baru
            siswa = await SiswaBaru.create({ id_siswa, id_kelas });
            res.status(201).json({
                status: 'success',
                message: "Data berhasil ditambahkan.",
                siswa
            });
        } else {
            // Jika sudah ada, update data kelasnya
            await SiswaBaru.update(
                { id_kelas }, // Data yang diperbarui
                { where: { id_siswa } } // Kondisi update
            );

            // Ambil ulang data terbaru
            siswa = await SiswaBaru.findOne({ where: { id_siswa } });

            res.status(200).json({
                status: 'success',
                message: "Data berhasil diperbarui.",
                siswa
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

const tampilKelas = async(req, res) => {
    const {id_siswa} = req.params;
    try {
        const data = await SiswaBaru.findOne({
            where:{id_siswa},
            include: [{
                model: KelasPpdb, as: 'kelas_ppdb'
            }]
        })
        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'Data siswa tidak ditemukan.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Data kelas berhasil diambil.',
            data
        });
    } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    });
  }
}


module.exports = { dataSiswa, regisSiswa, jurusan, bayarDaftar, deleteLog, detailSiswa, bayarPpdb, logPpdb, kelas, postKelas, tampilKelas };