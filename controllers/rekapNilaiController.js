const { PembagianMengajar, RiwayatKelas, SiswaPpdb, Tugas, PengumpulanTugas, NilaiManual, NilaiManualDetail } = require("../models");

async function ambilPengajaranMilikGuru(req, idPengajaran) {
  return PembagianMengajar.findOne({ where: { id_pengajaran: idPengajaran, id_user: req.user.userId } });
}

async function ambilRosterKelas(pengajaran) {
  const riwayat = await RiwayatKelas.findAll({
    where: {
      id_tahun_ajaran: pengajaran.id_tahun_ajaran,
      tingkat: pengajaran.tingkat,
      nama_kelas: pengajaran.nama_kelas,
    },
    include: [
      {
        model: SiswaPpdb,
        as: "siswa_ppdb",
        attributes: ["id_siswa", "nama_lengkap", "nisn", "status"],
        where: { status: "aktif" },
      },
    ],
    order: [[{ model: SiswaPpdb, as: "siswa_ppdb" }, "nama_lengkap", "ASC"]],
  });

  return riwayat.map((r) => ({ id_siswa: r.siswa_ppdb.id_siswa, nama_lengkap: r.siswa_ppdb.nama_lengkap, nisn: r.siswa_ppdb.nisn }));
}

// Rekap nilai satu kelas/mapel: gabungan nilai Tugas (dari pengumpulan_tugas,
// termasuk yang sudah di-auto-grade maupun sudah dinilai manual oleh guru
// untuk soal essay) dan Nilai Manual (nilai_manual_detail) - ditampilkan
// sebagai satu tabel siswa x semua penilaian, plus rata-rata per siswa.
const rekapNilai = async (req, res) => {
  try {
    const { id_pengajaran } = req.query;

    if (!id_pengajaran) {
      return res.status(400).json({ status: "error", message: "Parameter id_pengajaran wajib diisi." });
    }

    const pengajaran = await ambilPengajaranMilikGuru(req, id_pengajaran);
    if (!pengajaran) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const roster = await ambilRosterKelas(pengajaran);

    const tugasList = await Tugas.findAll({
      where: { id_pengajaran, status: "terbit" },
      attributes: ["id_tugas", "judul"],
      order: [["created_at", "ASC"]],
    });

    const nilaiManualList = await NilaiManual.findAll({
      where: { id_pengajaran },
      attributes: ["id_nilai_manual", "judul"],
      order: [["created_at", "ASC"]],
    });

    const idTugasList = tugasList.map((t) => t.id_tugas);
    const idNilaiManualList = nilaiManualList.map((n) => n.id_nilai_manual);

    const pengumpulanList = idTugasList.length
      ? await PengumpulanTugas.findAll({ where: { id_tugas: idTugasList }, attributes: ["id_tugas", "id_siswa", "nilai"] })
      : [];

    const nilaiManualDetailList = idNilaiManualList.length
      ? await NilaiManualDetail.findAll({ where: { id_nilai_manual: idNilaiManualList }, attributes: ["id_nilai_manual", "id_siswa", "nilai"] })
      : [];

    const kolom = [
      ...tugasList.map((t) => ({ tipe: "tugas", id: t.id_tugas, label: t.judul })),
      ...nilaiManualList.map((n) => ({ tipe: "manual", id: n.id_nilai_manual, label: n.judul })),
    ];

    const data = roster.map((s) => {
      const nilai = {};

      tugasList.forEach((t) => {
        const p = pengumpulanList.find((row) => row.id_tugas === t.id_tugas && row.id_siswa === s.id_siswa);
        nilai[t.id_tugas] = p?.nilai !== undefined && p?.nilai !== null ? Number(p.nilai) : null;
      });

      nilaiManualList.forEach((n) => {
        const d = nilaiManualDetailList.find((row) => row.id_nilai_manual === n.id_nilai_manual && row.id_siswa === s.id_siswa);
        nilai[n.id_nilai_manual] = d?.nilai !== undefined && d?.nilai !== null ? Number(d.nilai) : null;
      });

      const nilaiTerisi = Object.values(nilai).filter((n) => n !== null);
      const rataRata = nilaiTerisi.length
        ? Math.round((nilaiTerisi.reduce((a, b) => a + b, 0) / nilaiTerisi.length) * 100) / 100
        : null;

      return { ...s, nilai, rata_rata: rataRata };
    });

    return res.status(200).json({ status: "success", message: "Rekap nilai berhasil diambil.", data: { kolom, siswa: data } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil rekap nilai.", error: error.message });
  }
};

module.exports = { rekapNilai };
