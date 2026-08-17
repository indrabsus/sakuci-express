const { NilaiManual, NilaiManualDetail, PembagianMengajar, MataPelajaran, SiswaPpdb, RiwayatKelas } = require("../models");

async function ambilPengajaranMilikGuru(req, idPengajaran) {
  return PembagianMengajar.findOne({ where: { id_pengajaran: idPengajaran, id_user: req.user.userId } });
}

async function ambilNilaiManualMilikGuru(req, idNilaiManual) {
  const nilaiManual = await NilaiManual.findByPk(idNilaiManual);
  if (!nilaiManual) return null;
  const pengajaran = await ambilPengajaranMilikGuru(req, nilaiManual.id_pengajaran);
  return pengajaran ? nilaiManual : null;
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

const daftarNilaiManual = async (req, res) => {
  try {
    const pengajaranList = await PembagianMengajar.findAll({
      where: { id_user: req.user.userId },
      attributes: ["id_pengajaran", "id_tahun_ajaran", "tingkat", "nama_kelas"],
    });
    const idPengajaranList = pengajaranList.map((p) => p.id_pengajaran);

    const rows = idPengajaranList.length
      ? await NilaiManual.findAll({
          where: { id_pengajaran: idPengajaranList },
          include: [
            {
              model: PembagianMengajar,
              as: "pengajaran",
              attributes: ["tingkat", "nama_kelas"],
              include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
            },
            { model: NilaiManualDetail, as: "detail", attributes: ["nilai"] },
          ],
          order: [["created_at", "DESC"]],
        })
      : [];

    const rosterCountCache = new Map();
    const data = [];

    for (const row of rows) {
      const pengajaran = pengajaranList.find((p) => p.id_pengajaran === row.id_pengajaran);
      let totalSiswa = 0;

      if (pengajaran) {
        if (!rosterCountCache.has(pengajaran.id_pengajaran)) {
          const roster = await ambilRosterKelas(pengajaran);
          rosterCountCache.set(pengajaran.id_pengajaran, roster.length);
        }
        totalSiswa = rosterCountCache.get(pengajaran.id_pengajaran);
      }

      const nilaiTerisi = (row.detail || []).map((d) => Number(d.nilai)).filter((n) => !Number.isNaN(n));
      const rataRata = nilaiTerisi.length
        ? Math.round((nilaiTerisi.reduce((a, b) => a + b, 0) / nilaiTerisi.length) * 100) / 100
        : null;

      data.push({
        id_nilai_manual: row.id_nilai_manual,
        judul: row.judul,
        semester: row.semester,
        created_at: row.created_at,
        pengajaran: row.pengajaran,
        jumlah_dinilai: nilaiTerisi.length,
        total_siswa: totalSiswa,
        rata_rata: rataRata,
      });
    }

    return res.status(200).json({ status: "success", message: "Daftar nilai manual berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar nilai manual.", error: error.message });
  }
};

const buatNilaiManual = async (req, res) => {
  try {
    const idPengajaran = String(req.body?.id_pengajaran || "");
    const judul = String(req.body?.judul || "").trim();
    const semester = req.body?.semester === "genap" ? "genap" : "ganjil";

    if (!idPengajaran || !judul) {
      return res.status(400).json({ status: "error", message: "Kelas/mapel dan judul penilaian wajib diisi." });
    }

    const pengajaran = await ambilPengajaranMilikGuru(req, idPengajaran);
    if (!pengajaran) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const nilaiManual = await NilaiManual.create({ id_pengajaran: idPengajaran, judul, semester });

    return res.status(201).json({ status: "success", message: "Nilai manual berhasil dibuat.", data: { id_nilai_manual: nilaiManual.id_nilai_manual } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal membuat nilai manual.", error: error.message });
  }
};

const rosterNilaiManual = async (req, res) => {
  try {
    const idNilaiManual = String(req.query?.id_nilai_manual || "");

    if (!idNilaiManual) {
      return res.status(400).json({ status: "error", message: "Parameter id_nilai_manual wajib diisi." });
    }

    const nilaiManual = await ambilNilaiManualMilikGuru(req, idNilaiManual);
    if (!nilaiManual) {
      return res.status(404).json({ status: "error", message: "Data nilai manual tidak ditemukan." });
    }

    const pengajaran = await PembagianMengajar.findByPk(nilaiManual.id_pengajaran);
    const roster = await ambilRosterKelas(pengajaran);

    const detailList = await NilaiManualDetail.findAll({ where: { id_nilai_manual: idNilaiManual } });
    const nilaiMap = new Map(detailList.map((d) => [d.id_siswa, d.nilai]));

    const data = roster.map((s) => ({
      ...s,
      nilai: nilaiMap.has(s.id_siswa) ? Number(nilaiMap.get(s.id_siswa)) : null,
    }));

    return res.status(200).json({
      status: "success",
      message: "Roster nilai manual berhasil diambil.",
      data,
      judul: nilaiManual.judul,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil roster nilai manual.", error: error.message });
  }
};

const simpanNilaiManual = async (req, res) => {
  const t = await NilaiManual.sequelize.transaction();

  try {
    const idNilaiManual = String(req.body?.id_nilai_manual || "");
    const siswaList = Array.isArray(req.body?.siswa) ? req.body.siswa : [];

    if (!idNilaiManual || siswaList.length === 0) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Data nilai manual dan data siswa wajib diisi." });
    }

    const nilaiManual = await ambilNilaiManualMilikGuru(req, idNilaiManual);
    if (!nilaiManual) {
      await t.rollback();
      return res.status(404).json({ status: "error", message: "Data nilai manual tidak ditemukan." });
    }

    const rows = siswaList
      .filter((s) => s.nilai !== null && s.nilai !== undefined && s.nilai !== "" && !Number.isNaN(Number(s.nilai)))
      .map((s) => ({
        id_nilai_manual: idNilaiManual,
        id_siswa: s.id_siswa,
        nilai: Math.max(0, Math.min(100, Number(s.nilai))),
      }));

    await NilaiManualDetail.destroy({ where: { id_nilai_manual: idNilaiManual }, transaction: t });

    if (rows.length > 0) {
      await NilaiManualDetail.bulkCreate(rows, { transaction: t });
    }

    await nilaiManual.update({ updated_at: new Date() }, { transaction: t });
    await t.commit();

    return res.status(200).json({ status: "success", message: "Nilai berhasil disimpan." });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ status: "error", message: "Gagal menyimpan nilai.", error: error.message });
  }
};

const hapusNilaiManual = async (req, res) => {
  try {
    const nilaiManual = await ambilNilaiManualMilikGuru(req, req.params.id);

    if (!nilaiManual) {
      return res.status(404).json({ status: "error", message: "Data nilai manual tidak ditemukan." });
    }

    await NilaiManualDetail.destroy({ where: { id_nilai_manual: nilaiManual.id_nilai_manual } });
    await nilaiManual.destroy();

    return res.status(200).json({ status: "success", message: "Nilai manual berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus nilai manual.", error: error.message });
  }
};

module.exports = { daftarNilaiManual, buatNilaiManual, rosterNilaiManual, simpanNilaiManual, hapusNilaiManual };
