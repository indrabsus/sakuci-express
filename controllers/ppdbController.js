const {SiswaPpdb, JurusanPpdb, MasterPpdb, LogPpdb, KelasPpdb, SiswaBaru} = require('../models'); // Pastikan path benar
const {axios, axiosInstance} = require('../config/axios');
const moment = require('moment');
const fs = require("fs");
const catatLogAktivitas = require('../utils/catatLogAktivitas');
const path = require("path");

const kelas = async (req, res) => {
  const { tahun, id_kelas } = req.query

  try {
    const include = [
      {
        model: JurusanPpdb,
        as: 'jurusan_ppdb',
        required: true,
        include: [
          {
            model: MasterPpdb,
            as: 'master_ppdb',
            required: true,
            ...(tahun && {
              where: { tahun },
            }),
          },
        ],
      },
    ]

    const order = [
      [
        { model: JurusanPpdb, as: 'jurusan_ppdb' },
        { model: MasterPpdb, as: 'master_ppdb' },
        'tahun',
        'DESC'
      ]
    ]

    const data = id_kelas
      ? await KelasPpdb.findOne({
          where: { id_kelas },
          include,
        })
      : await KelasPpdb.findAll({
          include,
          order,
        })

    res.status(200).json({
      status: 'success',
      message: 'Data berhasil diambil.',
      data,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data kelas.',
      error: error.message,
    })
  }
}

const createKelas = async(req, res) => {
    const {nama_kelas, id_jurusan, max, tingkat} = req.body
    try{
        const data = await KelasPpdb.create({
            nama_kelas, id_jurusan, max, tingkat
        })
        if(!data){
            res.status(404).json({
                status: 'error',
                message: 'Gagal menambahkan data',
            })
        }
        res.status(200).json({
            status: 'success',
            message: 'Data berhasil ditambahkan',
            data
        })
    } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data.',
      error: error.message,
    });
  }
}

const updateKelas = async (req, res) => {
  const { nama_kelas, id_jurusan, max, tingkat } = req.body;
  const { id_kelas } = req.params;

  try {
    const [updated] = await KelasPpdb.update(
      { nama_kelas, id_jurusan, max, tingkat },
      { where: { id_kelas } }
    );

    if (updated === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan atau tidak ada perubahan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal memperbarui data.",
      error: error.message,
    });
  }
};

const deleteKelas = async (req, res) => {
    const {id_kelas} = req.params;
    try {
        const data = await KelasPpdb.destroy({
            where:{id_kelas}
        })
        res.status(200).json({
      status: "success",
      message: "Data berhasil dihapus.",
    });
    } catch (error) {
        res.status(500).json({
            status:"error",
            message: "Gagal menghapus data",
            error: error.message
        })
    }
}

const hitungSiswa = async (req, res) => {
    const { id_kelas } = req.params;
    try {
        const data = await SiswaBaru.count({
            where: { id_kelas }
        });

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

    const siswa = await LogPpdb.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: SiswaPpdb, as: 'siswa_ppdb',
        where: { tahun },
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
                model: SiswaBaru, as: 'siswa_baru',
                include: [{
                    model: KelasPpdb, as: 'kelas_ppdb'
                }]
            },{
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

// Username di-cek dulu ke DB sebelum dipakai (retry sampai 10x kalau
// bentrok) - sebelumnya tidak dicek sama sekali, jadi 2 siswa bisa kebagian
// alias yang sama persis kalau random 3 digitnya kebetulan cocok.
async function generateAlias(nama_lengkap) {
  const cleaned = nama_lengkap
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const shortName = cleaned.substring(0, 8);

  let kandidat;
  let percobaan = 0;

  do {
    const randomNum = Math.floor(100 + Math.random() * 900);
    kandidat = `${randomNum}${shortName}`;
    percobaan++;
  } while (percobaan <= 10 && (await SiswaPpdb.findOne({ where: { username: kandidat } })));

  return kandidat;
}

const trfServer = async (req, res) => {
  try {
    const {
      username,
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
      no_hp_ortu,
      bayar_daftar,
      tahun,
      status
    } = req.body

    // 1️⃣ Cek username sudah ada atau belum
    const existingUser = await SiswaPpdb.findOne({
      where: { username }
    })

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username sudah terdaftar"
      })
    }

    // 2️⃣ Simpan data
    const data = await SiswaPpdb.create({
      username,
      password: "$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm",
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
      no_hp_ortu,
      bayar_daftar,
      tahun, status
    })

    // 3️⃣ Response sukses
    return res.status(201).json({
      status: "success",
      message: "Data siswa berhasil disimpan",
      data
    })

  } catch (error) {
    console.error("Error saat menyimpan data siswa:", error)
    return res.status(500).json({
      status: "error",
      message: "Gagal menyimpan data siswa",
      error: error.message
    })
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
        no_hp_ortu,
        server_number
      } = req.body;
  
      // Format nomor HP
      const no_hpFormatted = formatNoHp(no_hp);
      const no_hp_ortuFormatted = formatNoHp(no_hp_ortu);
      const tahunSekarang = new Date().getFullYear();
  
      // Simpan data ke database
      const newSiswa = await SiswaPpdb.create({
        username: await generateAlias(nama_lengkap),
        password: "$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm",
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
        no_hp_ortu : no_hp_ortuFormatted,
        bayar_daftar: 'n',
        status: 'ppdb',
        tahun: tahunSekarang,
        wifi: 'f'
      });

      // console.log(newSiswa)

      // Kirim notifikasi Telegram (notifikasi WA dicabut - bot WA dihapus
      // dari backend ini karena berat saat reinitialize tiap restart server,
      // rencananya dipindah ke project terpisah).
      try {
        const text = `Pemberitahuan, ada siswa baru mendaftar dengan nama ${nama_lengkap}, dan asal sekolah dari ${asal_sekolah}, no Whatsapp : https://wa.me/${no_hpFormatted} | Status : ${server_number}`;
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

  // Password default sama dengan yang dipakai regisSiswa - siswa yang
  // ditambahkan lewat jalur cepat ini masih bisa login pakai password ini
  // kalau suatu saat dibutuhkan.
  const DEFAULT_PASSWORD_HASH = "$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm";

  const generatePlaceholderUnik = (prefix) => {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 90000 + 10000)}`;
  };

  // Tambah murid baru versi cepat (dipakai dari menu Pembayaran SPP-Next) -
  // cuma minta nama_lengkap, field wajib lain yang tidak relevan buat siswa
  // pindahan/susulan (biodata lengkap, kritik saran, dst) diisi placeholder
  // supaya tidak melanggar constraint NOT NULL / UNIQUE di tabel siswa_ppdb.
  // Status langsung "aktif" (bukan "ppdb") karena siswa ini memang sudah
  // masuk kelas, bukan pendaftar baru yang masih menunggu proses PPDB.
  const tambahSiswaCepat = async (req, res) => {
    const { nama_lengkap, tahun } = req.body;

    if (!nama_lengkap || !nama_lengkap.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Nama lengkap wajib diisi.",
      });
    }

    try {
      // Angkatan PPDB siswa ini - kalau ditambahkan ke tingkat 11/12 (bukan
      // 10), frontend mengirim tahun masuk yang sudah disesuaikan mundur
      // (mis. sekarang PPDB2026 = angkatan kelas 10, maka kelas 11 =
      // PPDB2025) supaya cocok dengan master SPP/PPDB angkatannya. Kalau
      // tidak dikirim, jatuhkan ke tahun sekarang.
      const tahunMasuk = Number(tahun) || new Date().getFullYear();

      const newSiswa = await SiswaPpdb.create({
        username: await generateAlias(nama_lengkap),
        password: DEFAULT_PASSWORD_HASH,
        nama_lengkap: nama_lengkap.trim(),
        tanggal_lahir: "2000-01-01",
        jenkel: "l",
        agama: "-",
        alamat: "-",
        nisn: generatePlaceholderUnik("NISN"),
        nik_siswa: generatePlaceholderUnik("NIK"),
        nama_ayah: "-",
        nama_ibu: "-",
        asal_sekolah: "-",
        minat_jurusan1: "-",
        minat_jurusan2: "-",
        no_hp: "000",
        no_hp_ortu: "000",
        tahun: tahunMasuk,
        bayar_daftar: "y",
        status: "aktif",
        wifi: "f",
      });

      catatLogAktivitas(req, {
        modul: "siswa",
        aksi: "create",
        keterangan: `Menambahkan murid baru ${newSiswa.nama_lengkap} lewat form cepat (cuma nama - data lain diisi placeholder)`,
        data_sebelum: null,
        data_sesudah: newSiswa.toJSON(),
      });

      return res.status(201).json({
        status: "success",
        message: "Murid baru berhasil ditambahkan.",
        data: newSiswa,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Gagal menambahkan murid baru.",
        error: error.message,
      });
    }
  };

  const updateSiswa = async (req, res) => {
  const { nama_lengkap,
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
        no_hp_ortu,
        status,
        id_siswa
  } = req.body;

  try {
    const dataSebelum = await SiswaPpdb.findByPk(id_siswa);

    if (!dataSebelum) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan atau tidak ada perubahan.",
      });
    }

    const nilaiSebelum = dataSebelum.toJSON();

    const [updated] = await SiswaPpdb.update(
      { nama_lengkap,
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
        no_hp_ortu,
        status },
      { where: { id_siswa } }
    );

    if (updated === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan atau tidak ada perubahan.",
      });
    }

    // Bandingkan cuma field yang benar-benar dikirim di request (field lain
    // undefined karena tidak dikirim, bukan berarti sengaja dikosongkan) -
    // supaya keterangan log akurat menyebutkan field mana saja yang berubah.
    const fieldLabels = {
      nama_lengkap: "Nama lengkap",
      tempat_lahir: "Tempat lahir",
      tanggal_lahir: "Tanggal lahir",
      jenkel: "Jenis kelamin",
      agama: "Agama",
      alamat: "Alamat",
      nisn: "NISN",
      nik_siswa: "NIK",
      nama_ayah: "Nama ayah",
      nama_ibu: "Nama ibu",
      asal_sekolah: "Asal sekolah",
      minat_jurusan1: "Minat jurusan 1",
      minat_jurusan2: "Minat jurusan 2",
      no_hp: "No HP siswa",
      no_hp_ortu: "No HP orang tua",
      status: "Status",
    };

    const nilaiBaru = {
      nama_lengkap, tempat_lahir, tanggal_lahir, jenkel, agama, alamat,
      nisn, nik_siswa, nama_ayah, nama_ibu, asal_sekolah, minat_jurusan1,
      minat_jurusan2, no_hp, no_hp_ortu, status,
    };

    const perubahan = [];

    Object.entries(nilaiBaru).forEach(([key, value]) => {
      if (value === undefined) return;

      const sebelum = nilaiSebelum[key];
      if (String(sebelum ?? "") === String(value ?? "")) return;

      perubahan.push(`${fieldLabels[key] || key}: "${sebelum ?? "-"}" -> "${value ?? "-"}"`);
    });

    if (perubahan.length > 0) {
      catatLogAktivitas(req, {
        modul: "siswa",
        aksi: "update",
        keterangan: `Mengubah data siswa ${nilaiSebelum.nama_lengkap}: ${perubahan.join(", ")}`,
        data_sebelum: nilaiSebelum,
        data_sesudah: nilaiBaru,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal memperbarui data.",
      error: error.message,
    });
  }
};

  const jurusan = async (req, res) => {
  const { id_jurusan } = req.params

  try {
    const include = [{
      model: MasterPpdb,
      as: 'master_ppdb'
    }]

    const order = [
      [{ model: MasterPpdb, as: 'master_ppdb' }, 'tahun', 'DESC'],
      ['nama_jurusan', 'ASC'] // optional biar rapi
    ]

    const jurusanPpdb = id_jurusan
      ? await JurusanPpdb.findOne({
          where: { id_jurusan },
          include,
        })
      : await JurusanPpdb.findAll({
          include,
          order
        })

    res.status(200).json({
      status: 'success',
      message: 'Data jurusan berhasil diambil.',
      data: jurusanPpdb,
    })

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data jurusan.',
      error: error.message,
    })
  }
}

const bayarDaftar = async (req, res) => {
    const { id_siswa, petugas, nominal, bayar } = req.body;
    const bukti = req.file ? `/uploads/bukti/${req.file.filename}` : null;
    

    try {
        const siswa = await SiswaPpdb.findOne({ where: { id_siswa } });
        if (!siswa) {
            return res.status(404).json({ error: 'Siswa not found' });
        }

        const noInvoice = `D-${moment().format('DDMMYYYYH')}${siswa.id_siswa}`;
        const cek = await LogPpdb.count({ where: { no_invoice: noInvoice } });
        
        if (cek < 1) {
            if (siswa.bayar_daftar === 'n') {
              const noInvoiceCreated = `P-${moment().format('DDMMYYYYHH')}-${id_siswa.substring(0, 3)}`;
                    const log = await LogPpdb.create({
                      id_siswa,
                      nominal,
                      no_invoice: noInvoiceCreated,
                      jenis: 'd',
                      petugas,
                      bukti,
                      bayar
                    });
                    
                    await SiswaPpdb.update({ bayar_daftar: 'y' }, { where: { id_siswa } });
                    return res.json({
                        status: 'ok',
                        message: 'Berhasil daftar!',
                        id_log: log.id_log,
                      });
            } else {
                return res.status(400).json({ error: 'Siswa sudah bayar daftar' });
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
  const { id_siswa, nominal, petugas, bayar } = req.body;  
  const bukti = req.file ? `/uploads/bukti/${req.file.filename}` : null;

  try {
    const nom2 = await LogPpdb.sum('nominal', {
      where: { id_siswa: id_siswa, jenis: "p" }
    });

    const noInvoice = `P-${moment().format('DDMMYYYYHH')}${id_siswa}`;
    const existingPayment = await LogPpdb.count({
      where: { no_invoice: noInvoice }
    });

    const masterPpdb = await MasterPpdb.findOne({
      where: { tahun: moment().year() }
    });

    if (!masterPpdb) {
      return res.status(400).json({ status: "gagal", message: 'Master data PPDB tidak ditemukan!' });
    }

    const inputNow = Number(nominal) + Number(nom2 || 0);

    if (inputNow > masterPpdb.ppdb) {
      return res.status(400).json({ status: "gagal", message: 'Melebihi jumlah nominal!' });
    }

    if (existingPayment < 1) {
      const noInvoiceCreated = `P-${moment().format('DDMMYYYYHH')}-${id_siswa.substring(0, 3)}`;
      const tampung = await LogPpdb.create({
        id_siswa,
        nominal: nominal,
        no_invoice: noInvoiceCreated,
        jenis: 'p',
        bayar,
        petugas,
        bukti // simpan path bukti
      });

      return res.status(200).json({ status: "sukses", message: 'Berhasil membayar!', data: tampung });
    } else {
      return res.status(400).json({ status: "gagal", message: 'Tunggu beberapa saat!' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "gagal", message: 'Terjadi kesalahan!' });
  }
};



const deleteLog = async (req, res) => {
  const { id_log } = req.params;
  const { jenis, id_siswa } = req.body;

  try {
    // 🔹 ambil data log dulu
    const log = await LogPpdb.findOne({ where: { id_log } });

    if (!log) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // 🔹 hapus file bukti kalau ada
    if (log.bukti) {
      const filePath = path.join(__dirname, "..", log.bukti);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 🔹 update siswa kalau jenis daftar
    if (jenis === "d") {
      await SiswaPpdb.update(
        { bayar_daftar: "n" },
        { where: { id_siswa } }
      );
    }

    // 🔹 hapus log
    await LogPpdb.destroy({ where: { id_log } });

    return res.json({ message: "Data & bukti berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting log:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const postKelas = async (req, res) => {
    const { id_siswa, id_kelas } = req.body;

    try {
        // Cek apakah kelas yang dituju ada
        const kelas = await KelasPpdb.findOne({ where: { id_kelas } });

        if (!kelas) {
            return res.status(404).json({
                status: "error",
                message: "Kelas tidak ditemukan."
            });
        }

        // Hitung jumlah siswa saat ini di kelas yang dituju
        const jumlahSiswa = await SiswaBaru.count({ where: { id_kelas } });

        // Jika jumlah siswa sudah mencapai batas maksimum, tolak perpindahan
        if (jumlahSiswa >= kelas.max) {
            return res.status(400).json({
                status: "error",
                message: `Kelas ${kelas.nama_kelas} sudah penuh. Maksimal ${kelas.max} siswa.`
            });
        }

        // Cek apakah siswa sudah ada berdasarkan id_siswa saja
        let siswa = await SiswaBaru.findOne({ where: { id_siswa } });

        if (!siswa) {
            // Jika tidak ada, buat data baru
            siswa = await SiswaBaru.create({ id_siswa, id_kelas });
            return res.status(201).json({
                status: "success",
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

            return res.status(200).json({
                status: "success",
                message: "Data berhasil diperbarui.",
                siswa
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

const masterPpdb = async (req, res) => {
  const { id_ppdb } = req.params
  const { tahun } = req.query

  try {
    let data

    // 🔹 PRIORITAS 1: berdasarkan ID
    if (id_ppdb) {
      data = await MasterPpdb.findOne({
        where: {
          id_ppdb,
          ...(tahun && { tahun })
        }
      })
    }

    // 🔹 PRIORITAS 2: berdasarkan tahun (1 tahun = 1 PPDB)
    else if (tahun) {
      data = await MasterPpdb.findOne({
        where: { tahun }
      })
    }

    // 🔹 PRIORITAS 3: ambil semua
    else {
      data = await MasterPpdb.findAll({
        order: [['tahun', 'DESC']]
      })
    }

    return res.status(200).json({
      status: 'success',
      message: 'Data berhasil diambil',
      data
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data.',
      error: error.message
    })
  }
}

const createMaster = async(req, res) => {
  try {
    const {daftar, ppdb, token_telegram, chat_id, tahun, kode_akses} = req.body;
    const data = await MasterPpdb.create({
        daftar, ppdb, token_telegram, chat_id, tahun, kode_akses
    })
    if(!data){
        res.status(404).json({
            status: 'error',
            message: 'Gagal menambahkan data',
        })
    }
    res.status(200).json({
        status: 'success',
        message: 'Data berhasil ditambahkan',
        data
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data.',
      error: error.message,
    });
  }
}

const updateMaster = async (req, res) => {
  const { daftar, ppdb, token_telegram, chat_id, tahun, kode_akses } = req.body;
  const { id_ppdb } = req.params;

  try {
    const [updated] = await MasterPpdb.update(
      { daftar, ppdb, token_telegram, chat_id, tahun, kode_akses },
      { where: { id_ppdb } }
    );

    if (updated === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error saat update data:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal update data.",
      error: error.message,
    });
  }
};

const deleteMaster = async(req, res) => {
  try {
    const { id_ppdb } = req.params;
    const data = await MasterPpdb.destroy({
      where: {id_ppdb}
    })
    return res.json({
      message: "Data berhasil dihapus",
      data
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
}

const createJurusan = async(req, res) => {
    const {nama_jurusan, id_ppdb} = req.body
    try{
        const data = await JurusanPpdb.create({
            nama_jurusan, id_ppdb
        })
        if(!data){
            res.status(404).json({
                status: 'error',
                message: 'Gagal menambahkan data',
            })
        }
        res.status(200).json({
            status: 'success',
            message: 'Data berhasil ditambahkan',
            data
        })
    } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data.',
      error: error.message,
    });
  }
}

const updateJurusan = async (req, res) => {
  const { nama_jurusan, id_ppdb } = req.body;
  const { id_jurusan } = req.params;

  try {
    const [updated] = await JurusanPpdb.update(
      { nama_jurusan, id_ppdb },
      { where: { id_jurusan } }
    );

    if (updated === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan atau tidak ada perubahan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal memperbarui data.",
      error: error.message,
    });
  }
};

const deleteJurusan = async (req, res) => {
    const {id_jurusan} = req.params;
    try {
        const data = await JurusanPpdb.destroy({
            where:{id_jurusan}
        })
        res.status(200).json({
      status: "success",
      message: "Data berhasil dihapus.",
    });
    } catch (error) {
        res.status(500).json({
            status:"error",
            message: "Gagal menghapus data",
            error: error.message
        })
    }
}

const siswaKelas = async (req, res) => {
  const { id_kelas, tahun } = req.params;

  try {
    let whereCondition = {};
    if (id_kelas) whereCondition.id_kelas = id_kelas;

    const data = await SiswaBaru.findAll({
      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
          required: true,
        },
        {
          model: KelasPpdb,
          as: "kelas_ppdb",
          required: true,
          where: Object.keys(whereCondition).length ? whereCondition : undefined,
          include: [
            {
              model: JurusanPpdb,
              as: "jurusan_ppdb",
              required: true, // ✅ Pastikan hanya data dengan jurusan yang cocok yang diambil
              include: [
                {
                  model: MasterPpdb,
                  as: "master_ppdb",
                  required: true, // ✅ Ini memastikan hanya data dengan `tahun` yang cocok yang diambil
                  where: tahun ? { tahun } : undefined,
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      message: "Data berhasil diambil.",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data kelas.",
      error: error.message,
    });
  }
};

const deleteSiswa = async (req, res) => {
    const {id_siswa} = req.body;
    try {
        await SiswaPpdb.destroy({
            where: {id_siswa}
        })
        res.status(200).json({
            status: "success",
            message: "Data berhasil dihapus"
        })
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Gagal menghapus data",
            error: error.message
        })
    }
}

const leaveSiswa = async (req, res) => {
    const { id_siswa } = req.body;

    try {
        // Jalankan dua update secara bersamaan
        const [updated, updated2] = await Promise.all([
            SiswaPpdb.update({ bayar_daftar: "l" }, { where: { id_siswa } }),
            LogPpdb.update({ jenis: 'l' }, { where: { id_siswa, jenis: 'p' } })
        ]);

        // Jika kedua update gagal
        if (updated[0] === 0 && updated2[0] === 0) {
            return res.status(404).json({
                status: "error",
                message: "Data tidak ditemukan atau tidak ada perubahan.",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Data berhasil diperbarui.",
            updatedRows: { siswaPpdb: updated[0], logPpdb: updated2[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Data gagal diperbarui.",
            error: error.message,
        });
    }
};

const updateLog = async (req, res) => {
  try {
    const { id_log } = req.params;

    const data = await LogPpdb.findOne({
      where: { id_log },
    });

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan.",
        data: null,
      });
    }

    const updateData = {
      nominal: req.body.nominal,
      bayar: req.body.bayar,
      petugas: req.body.petugas,
      created_at: req.body.created_at,
      jenis: req.body.jenis,
    };

    if (req.file) {
      updateData.bukti = `/uploads/bukti/${req.file.filename}`;
    }

    await LogPpdb.update(updateData, {
      where: { id_log },
    });

    const updatedData = await LogPpdb.findOne({
      where: { id_log },
      include: [
        {
          model: SiswaPpdb,
          as: "siswa_ppdb",
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Data berhasil diperbarui.",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error saat update data:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal update data.",
      error: error.message,
    });
  }
};

const deleteKelasSiswa = async (req, res) => {
  try {
    const { id_siswa } = req.params;

    if (!id_siswa) {
      return res.status(400).json({
        status: "error",
        message: "id_siswa wajib dikirim.",
      });
    }

    const deleted = await SiswaBaru.destroy({
      where: {
        id_siswa,
      },
    });

    if (deleted === 0) {
      return res.status(404).json({
        status: "error",
        message: "Siswa tidak ditemukan di kelas.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Siswa berhasil dihapus dari kelas.",
      deletedRows: deleted,
    });
  } catch (error) {
    console.error("Error deleteKelasSiswa:", error);

    return res.status(500).json({
      status: "error",
      message: "Gagal menghapus siswa dari kelas.",
      error: error.message,
    });
  }
};


const backupJson = async (req, res) => {
  try {
    const { tahun } = req.params;

    if (!tahun) {
      return res.status(400).json({
        status: "error",
        message: "Tahun wajib diisi.",
      });
    }

    // 1. master_ppdb sesuai tahun
    const master = await MasterPpdb.findAll({
      where: { tahun },
      raw: true,
    });

    const idPpdb = master.map((item) => item.id_ppdb);

    // 2. jurusan_ppdb sesuai id_ppdb
    const jurusan = await JurusanPpdb.findAll({
      where: {
        id_ppdb: idPpdb,
      },
      raw: true,
    });

    const idJurusan = jurusan.map((item) => item.id_jurusan);

    // 3. kelas_ppdb sesuai id_jurusan
    const kelas = await KelasPpdb.findAll({
      where: {
        id_jurusan: idJurusan,
      },
      raw: true,
    });

    const idKelas = kelas.map((item) => item.id_kelas);

    // 4. siswa_ppdb sesuai tahun
    const siswa = await SiswaPpdb.findAll({
      where: { tahun },
      raw: true,
    });

    const idSiswa = siswa.map((item) => item.id_siswa);

    // 5. siswa_baru nyambung ke kelas_ppdb dan siswa_ppdb
    const siswaBaru = await SiswaBaru.findAll({
      where: {
        id_siswa: idSiswa,
        id_kelas: idKelas,
      },
      raw: true,
    });

    // 6. log_ppdb sesuai siswa tahun tersebut
    const log = await LogPpdb.findAll({
      where: {
        id_siswa: idSiswa,
      },
      raw: true,
    });

    const data = {
      version: 1,
      tahun: Number(tahun),
      backup_at: new Date(),

      master_ppdb: master,
      jurusan_ppdb: jurusan,
      kelas_ppdb: kelas,
      siswa_ppdb: siswa,
      siswa_baru: siswaBaru,
      log_ppdb: log,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=backup-ppdb-${tahun}.json`
    );

    return res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("ERROR BACKUP JSON:", error);

    return res.status(500).json({
      status: "error",
      message: "Backup gagal.",
      error: error.message,
    });
  }
};

const restoreJson = async (req, res) => {
  try {
    const backup = req.body;
    const tahun = backup.tahun;

    if (!tahun) {
      return res.status(400).json({
        status: "error",
        message: "File backup tidak valid. Tahun tidak ditemukan.",
      });
    }

    const restoreTable = async (Model, rows, primaryKey) => {
      let inserted = 0;
      let skipped = 0;
      let failed = 0;

      if (!Array.isArray(rows) || rows.length === 0) {
        return { inserted, skipped, failed };
      }

      for (const row of rows) {
        try {
          const id = row[primaryKey];

          if (!id) {
            failed++;
            continue;
          }

          const exists = await Model.findOne({
            where: {
              [primaryKey]: id,
            },
          });

          if (exists) {
            skipped++;
            continue;
          }

          await Model.create(row);
          inserted++;
        } catch (error) {
          failed++;
          console.error(`Restore gagal di ${primaryKey}:`, error.message);
        }
      }

      return { inserted, skipped, failed };
    };

    // urutan insert harus dari induk ke anak
    const result = {
      master_ppdb: await restoreTable(
        MasterPpdb,
        backup.master_ppdb,
        "id_ppdb"
      ),

      jurusan_ppdb: await restoreTable(
        JurusanPpdb,
        backup.jurusan_ppdb,
        "id_jurusan"
      ),

      kelas_ppdb: await restoreTable(
        KelasPpdb,
        backup.kelas_ppdb,
        "id_kelas"
      ),

      siswa_ppdb: await restoreTable(
        SiswaPpdb,
        backup.siswa_ppdb,
        "id_siswa"
      ),

      siswa_baru: await restoreTable(
        SiswaBaru,
        backup.siswa_baru,
        "id_siswa_baru"
      ),

      log_ppdb: await restoreTable(
        LogPpdb,
        backup.log_ppdb,
        "id_log"
      ),
    };

    const totalInserted = Object.values(result).reduce(
      (sum, item) => sum + item.inserted,
      0
    );

    const totalSkipped = Object.values(result).reduce(
      (sum, item) => sum + item.skipped,
      0
    );

    const totalFailed = Object.values(result).reduce(
      (sum, item) => sum + item.failed,
      0
    );

    return res.status(200).json({
      status: "success",
      message: `Restore selesai. Masuk ${totalInserted}, skip ${totalSkipped}, gagal ${totalFailed}.`,
      tahun,
      summary: result,
      total: {
        inserted: totalInserted,
        skipped: totalSkipped,
        failed: totalFailed,
      },
    });
  } catch (error) {
    console.error("ERROR RESTORE JSON:", error);

    return res.status(500).json({
      status: "error",
      message: "Restore gagal.",
      error: error.message,
    });
  }
};



// Status PPDB milik siswa yang login sendiri - status akun, pembayaran
// biaya daftar, penempatan kelas (kalau sudah ditempatkan), dan riwayat
// pembayaran PPDB.
const statusPpdbSiswa = async (req, res) => {
  try {
    const idSiswa = req.user.userId;

    const siswa = await SiswaPpdb.findByPk(idSiswa, {
      attributes: ["id_siswa", "nama_lengkap", "status", "bayar_daftar", "tahun"],
    });

    if (!siswa) {
      return res.status(404).json({ status: "error", message: "Data siswa tidak ditemukan." });
    }

    const siswaBaru = await SiswaBaru.findOne({
      where: { id_siswa: idSiswa },
      include: [{ model: KelasPpdb, as: "kelas_ppdb" }],
    });

    const logPpdbList = await LogPpdb.findAll({ where: { id_siswa: idSiswa }, order: [["created_at", "DESC"]] });

    return res.status(200).json({
      status: "success",
      message: "Status PPDB berhasil diambil.",
      data: {
        siswa,
        penempatan_kelas: siswaBaru?.kelas_ppdb || null,
        riwayat_pembayaran: logPpdbList,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil status PPDB.", error: error.message });
  }
};

module.exports = { dataSiswa, regisSiswa, tambahSiswaCepat, jurusan, bayarDaftar, deleteLog, bayarPpdb, logPpdb, kelas, postKelas, createJurusan, masterPpdb, updateJurusan, deleteJurusan, createKelas, siswaKelas, updateSiswa, deleteKelasSiswa,
updateKelas, deleteKelas, hitungSiswa, deleteSiswa, leaveSiswa, updateLog, createMaster,
updateMaster, deleteMaster, trfServer, backupJson, restoreJson, statusPpdbSiswa};