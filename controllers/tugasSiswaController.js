const {
  Tugas,
  TugasSoal,
  BankSoal,
  OpsiJawaban,
  PembagianMengajar,
  RiwayatKelas,
  MataPelajaran,
  PengumpulanTugas,
  JawabanTugasSiswa,
} = require("../models");
const { getTahunAjaranAktifNama, getIdTahunAjaran } = require("../utils/tahunAjaran");

// Kelas siswa "saat ini" ditentukan dari riwayat_kelas di tahun ajaran aktif
// - dipakai untuk mencocokkan tugas dari pembagian_mengajar mana saja yang
// relevan buat siswa ini (sama seperti pola di nilaiManualController/
// materiAjarController, tapi dibalik: dari siswa ke daftar pengajaran,
// bukan dari pengajaran ke roster siswa).
async function ambilKelasSaatIniSiswa(idSiswa) {
  const namaTahunAktif = await getTahunAjaranAktifNama();
  if (!namaTahunAktif) return null;

  const idTahunAjaran = await getIdTahunAjaran(namaTahunAktif);
  if (!idTahunAjaran) return null;

  const riwayat = await RiwayatKelas.findOne({ where: { id_siswa: idSiswa, id_tahun_ajaran: idTahunAjaran } });
  return riwayat ? { tingkat: riwayat.tingkat, nama_kelas: riwayat.nama_kelas, id_tahun_ajaran: idTahunAjaran } : null;
}

async function ambilIdPengajaranSiswa(kelasSaatIni) {
  if (!kelasSaatIni) return [];

  const rows = await PembagianMengajar.findAll({
    where: {
      id_tahun_ajaran: kelasSaatIni.id_tahun_ajaran,
      tingkat: kelasSaatIni.tingkat,
      nama_kelas: kelasSaatIni.nama_kelas,
    },
    attributes: ["id_pengajaran"],
  });

  return rows.map((r) => r.id_pengajaran);
}

const daftarTugasSiswa = async (req, res) => {
  try {
    const kelasSaatIni = await ambilKelasSaatIniSiswa(req.user.userId);
    const idPengajaranList = await ambilIdPengajaranSiswa(kelasSaatIni);

    const rows = idPengajaranList.length
      ? await Tugas.findAll({
          where: { id_pengajaran: idPengajaranList, status: "terbit" },
          include: [
            {
              model: PembagianMengajar,
              as: "pengajaran",
              attributes: ["tingkat", "nama_kelas"],
              include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
            },
            { model: TugasSoal, as: "tugas_soal", attributes: ["id_tugas_soal"] },
          ],
          order: [["deadline", "ASC"]],
        })
      : [];

    const idTugasList = rows.map((r) => r.id_tugas);
    const pengumpulanList = idTugasList.length
      ? await PengumpulanTugas.findAll({ where: { id_tugas: idTugasList, id_siswa: req.user.userId } })
      : [];
    const pengumpulanMap = new Map(pengumpulanList.map((p) => [p.id_tugas, p]));

    const data = rows.map((row) => {
      const pengumpulan = pengumpulanMap.get(row.id_tugas);
      return {
        ...row.toJSON(),
        jumlah_soal: row.tugas_soal?.length || 0,
        status_pengerjaan: pengumpulan?.status || "belum",
        nilai: pengumpulan?.nilai ?? null,
      };
    });

    return res.status(200).json({ status: "success", message: "Daftar tugas berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar tugas.", error: error.message });
  }
};

// Membuka tugas untuk dikerjakan - otomatis membuat baris pengumpulan_tugas
// (status "dikerjakan") kalau ini pertama kali dibuka. Kunci jawaban
// (is_benar, kategori opsi yang benar) dan pembahasan sengaja TIDAK
// diikutkan di sini supaya tidak bocor sebelum dikumpulkan.
const detailTugasSiswa = async (req, res) => {
  try {
    const { id_tugas } = req.params;

    const kelasSaatIni = await ambilKelasSaatIniSiswa(req.user.userId);
    const idPengajaranList = await ambilIdPengajaranSiswa(kelasSaatIni);

    const tugas = await Tugas.findOne({
      where: { id_tugas, status: "terbit" },
      include: [
        {
          model: PembagianMengajar,
          as: "pengajaran",
          attributes: ["tingkat", "nama_kelas"],
          include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
        },
      ],
    });

    if (!tugas || !idPengajaranList.includes(tugas.id_pengajaran)) {
      return res.status(404).json({ status: "error", message: "Tugas tidak ditemukan." });
    }

    let pengumpulan = await PengumpulanTugas.findOne({ where: { id_tugas, id_siswa: req.user.userId } });

    if (pengumpulan && pengumpulan.status !== "dikerjakan") {
      return res.status(409).json({ status: "error", message: "Tugas ini sudah Anda kumpulkan." });
    }

    if (tugas.deadline && new Date(tugas.deadline).getTime() < Date.now()) {
      return res.status(410).json({ status: "error", message: "Tenggat waktu tugas ini sudah lewat." });
    }

    if (!pengumpulan) {
      pengumpulan = await PengumpulanTugas.create({
        id_tugas,
        id_siswa: req.user.userId,
        status: "dikerjakan",
        mulai_at: new Date(),
      });
    }

    const soalList = await TugasSoal.findAll({
      where: { id_tugas },
      include: [
        {
          model: BankSoal,
          as: "soal",
          attributes: ["id_soal", "tipe_soal", "daftar_kategori", "pertanyaan", "gambar_url"],
          include: [{ model: OpsiJawaban, as: "opsi", attributes: ["id_opsi", "label", "isi_opsi", "gambar_url"] }],
        },
      ],
      order: [["nomor", "ASC"]],
    });

    const jawabanTersimpan = await JawabanTugasSiswa.findAll({
      where: { id_pengumpulan: pengumpulan.id_pengumpulan },
      attributes: ["id_soal", "id_opsi", "jawaban_text"],
    });

    return res.status(200).json({
      status: "success",
      message: "Detail tugas berhasil diambil.",
      data: { tugas, soal: soalList, jawaban_tersimpan: jawabanTersimpan },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil detail tugas.", error: error.message });
  }
};

// Auto-grading: pg_tunggal (cocokkan 1 opsi), pg_mcma (cocokkan SET opsi
// persis, all-or-nothing), pg_kategori (persentase opsi yang kategori
// tebakannya benar). Essay tetap "selesai" menunggu penilaian manual guru -
// belum ada fitur guru menilai essay, jadi nilai bagian essay tidak masuk
// hitungan otomatis (hanya rata-rata dari bagian yang otomatis ternilai).
const submitTugasSiswa = async (req, res) => {
  const t = await PengumpulanTugas.sequelize.transaction();

  try {
    const { id_tugas } = req.params;
    const jawabanList = Array.isArray(req.body?.jawaban) ? req.body.jawaban : [];

    const pengumpulan = await PengumpulanTugas.findOne({ where: { id_tugas, id_siswa: req.user.userId } });
    if (!pengumpulan) {
      await t.rollback();
      return res.status(404).json({ status: "error", message: "Anda belum membuka tugas ini." });
    }
    if (pengumpulan.status !== "dikerjakan") {
      await t.rollback();
      return res.status(409).json({ status: "error", message: "Tugas ini sudah dikumpulkan sebelumnya." });
    }

    const tugas = await Tugas.findByPk(id_tugas);
    if (tugas?.deadline && new Date(tugas.deadline).getTime() < Date.now()) {
      await t.rollback();
      return res.status(410).json({ status: "error", message: "Tenggat waktu tugas ini sudah lewat." });
    }

    const soalList = await TugasSoal.findAll({
      where: { id_tugas },
      include: [{ model: BankSoal, as: "soal", include: [{ model: OpsiJawaban, as: "opsi" }] }],
    });

    await JawabanTugasSiswa.destroy({ where: { id_pengumpulan: pengumpulan.id_pengumpulan }, transaction: t });

    let adaPenilaianManual = false;
    const skorPerSoal = [];
    const rowsJawaban = [];

    for (const ts of soalList) {
      const soal = ts.soal;
      const bobot = ts.bobot || 1;
      const jawabanSiswa = jawabanList.find((j) => j.id_soal === soal.id_soal);

      if (soal.tipe_soal === "pg_tunggal") {
        const idOpsi = jawabanSiswa?.id_opsi || null;
        const opsiTerpilih = idOpsi ? soal.opsi.find((o) => o.id_opsi === idOpsi) : null;
        const benar = !!opsiTerpilih?.is_benar;
        const skor = idOpsi ? (benar ? 100 : 0) : 0;
        skorPerSoal.push({ bobot, skor });
        rowsJawaban.push({
          id_pengumpulan: pengumpulan.id_pengumpulan,
          id_soal: soal.id_soal,
          id_opsi: idOpsi,
          is_benar: idOpsi ? benar : null,
          nilai: idOpsi ? skor : null,
        });
      } else if (soal.tipe_soal === "pg_mcma") {
        const idOpsiList = Array.isArray(jawabanSiswa?.id_opsi_list) ? jawabanSiswa.id_opsi_list : [];
        const setBenar = new Set(soal.opsi.filter((o) => o.is_benar).map((o) => o.id_opsi));
        const setJawab = new Set(idOpsiList);
        const cocok = idOpsiList.length > 0 && setBenar.size === setJawab.size && [...setBenar].every((id) => setJawab.has(id));
        const skor = cocok ? 100 : 0;
        skorPerSoal.push({ bobot, skor });

        if (idOpsiList.length === 0) {
          rowsJawaban.push({ id_pengumpulan: pengumpulan.id_pengumpulan, id_soal: soal.id_soal, id_opsi: null, is_benar: null, nilai: null });
        } else {
          idOpsiList.forEach((idOpsi) => {
            rowsJawaban.push({ id_pengumpulan: pengumpulan.id_pengumpulan, id_soal: soal.id_soal, id_opsi: idOpsi, is_benar: cocok, nilai: skor });
          });
        }
      } else if (soal.tipe_soal === "pg_kategori") {
        const kategoriJawaban =
          jawabanSiswa?.kategori_jawaban && typeof jawabanSiswa.kategori_jawaban === "object" ? jawabanSiswa.kategori_jawaban : {};
        const opsiSoal = soal.opsi || [];
        let benarCount = 0;
        const hasilPerOpsi = opsiSoal.map((o) => {
          const tebakan = kategoriJawaban[o.id_opsi] ? String(kategoriJawaban[o.id_opsi]).trim() : null;
          const benar = !!tebakan && tebakan === String(o.kategori || "").trim();
          if (benar) benarCount += 1;
          return { opsi: o, tebakan, benar };
        });

        const skor = opsiSoal.length > 0 ? Math.round((benarCount / opsiSoal.length) * 100) : 0;
        skorPerSoal.push({ bobot, skor });

        // Simpan skor soal ini di tiap baris (sama seperti pg_mcma) supaya
        // bisa dipakai lagi saat guru menghitung ulang nilai akhir (mis.
        // setelah menilai essay).
        hasilPerOpsi.forEach(({ opsi, tebakan, benar }) => {
          rowsJawaban.push({
            id_pengumpulan: pengumpulan.id_pengumpulan,
            id_soal: soal.id_soal,
            id_opsi: opsi.id_opsi,
            jawaban_text: tebakan,
            is_benar: tebakan ? benar : null,
            nilai: skor,
          });
        });
      } else {
        // essay - menunggu penilaian manual
        adaPenilaianManual = true;
        const teks = String(jawabanSiswa?.jawaban_text || "").trim() || null;
        rowsJawaban.push({
          id_pengumpulan: pengumpulan.id_pengumpulan,
          id_soal: soal.id_soal,
          jawaban_text: teks,
          is_benar: null,
          nilai: null,
        });
      }
    }

    if (rowsJawaban.length > 0) {
      await JawabanTugasSiswa.bulkCreate(rowsJawaban, { transaction: t });
    }

    const totalBobot = skorPerSoal.reduce((sum, s) => sum + s.bobot, 0);
    const nilaiOtomatis =
      totalBobot > 0 ? Math.round((skorPerSoal.reduce((sum, s) => sum + s.skor * s.bobot, 0) / totalBobot) * 100) / 100 : null;

    await pengumpulan.update(
      {
        status: adaPenilaianManual ? "selesai" : "dinilai",
        selesai_at: new Date(),
        nilai: nilaiOtomatis,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({ status: "success", message: "Jawaban berhasil dikumpulkan." });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ status: "error", message: "Gagal mengumpulkan jawaban.", error: error.message });
  }
};

// Hasil cuma bisa dilihat setelah dikumpulkan - baru di sini pembahasan dan
// kunci jawaban (is_benar/kategori asli) diikutkan.
const hasilTugasSiswa = async (req, res) => {
  try {
    const { id_tugas } = req.params;

    const pengumpulan = await PengumpulanTugas.findOne({ where: { id_tugas, id_siswa: req.user.userId } });
    if (!pengumpulan || pengumpulan.status === "dikerjakan") {
      return res.status(404).json({ status: "error", message: "Anda belum mengumpulkan tugas ini." });
    }

    const tugas = await Tugas.findByPk(id_tugas, {
      include: [
        {
          model: PembagianMengajar,
          as: "pengajaran",
          attributes: ["tingkat", "nama_kelas"],
          include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
        },
      ],
    });

    const soalList = await TugasSoal.findAll({
      where: { id_tugas },
      include: [{ model: BankSoal, as: "soal", include: [{ model: OpsiJawaban, as: "opsi" }] }],
      order: [["nomor", "ASC"]],
    });

    const jawabanList = await JawabanTugasSiswa.findAll({ where: { id_pengumpulan: pengumpulan.id_pengumpulan } });

    return res.status(200).json({
      status: "success",
      message: "Hasil tugas berhasil diambil.",
      data: { tugas, pengumpulan, soal: soalList, jawaban: jawabanList },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil hasil tugas.", error: error.message });
  }
};

module.exports = { daftarTugasSiswa, detailTugasSiswa, submitTugasSiswa, hasilTugasSiswa };
