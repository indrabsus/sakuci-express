const { AbsenKelas, AbsenKelasDetail, PembagianMengajar, SiswaPpdb, RiwayatKelas } = require("../models");

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

const daftarRiwayat = async (req, res) => {
  try {
    const { id_pengajaran } = req.query;

    if (!id_pengajaran || !(await ambilPengajaranMilikGuru(req, id_pengajaran))) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const sesiList = await AbsenKelas.findAll({
      where: { id_pengajaran },
      include: [{ model: AbsenKelasDetail, as: "detail", attributes: ["status"] }],
      order: [["tanggal", "DESC"]],
    });

    const data = sesiList.map((s) => {
      const rekap = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
      (s.detail || []).forEach((d) => {
        rekap[d.status] += 1;
      });
      return {
        id_absen_kelas: s.id_absen_kelas,
        tanggal: s.tanggal,
        jumlah_siswa: s.detail?.length || 0,
        rekap,
      };
    });

    return res.status(200).json({ status: "success", message: "Riwayat absen berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil riwayat absen.", error: error.message });
  }
};

const rosterAbsen = async (req, res) => {
  try {
    const { id_pengajaran, tanggal } = req.query;

    if (!id_pengajaran || !tanggal) {
      return res.status(400).json({ status: "error", message: "Parameter id_pengajaran dan tanggal wajib diisi." });
    }

    const pengajaran = await ambilPengajaranMilikGuru(req, id_pengajaran);
    if (!pengajaran) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const roster = await ambilRosterKelas(pengajaran);

    const sesi = await AbsenKelas.findOne({
      where: { id_pengajaran, tanggal },
      include: [{ model: AbsenKelasDetail, as: "detail" }],
    });

    const statusMap = new Map((sesi?.detail || []).map((d) => [d.id_siswa, { status: d.status, keterangan: d.keterangan }]));

    const data = roster.map((s) => ({
      ...s,
      status: statusMap.get(s.id_siswa)?.status || "hadir",
      keterangan: statusMap.get(s.id_siswa)?.keterangan || null,
    }));

    return res.status(200).json({ status: "success", message: "Roster absen berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil roster absen.", error: error.message });
  }
};

const simpanAbsen = async (req, res) => {
  const t = await AbsenKelas.sequelize.transaction();

  try {
    const idPengajaran = String(req.body?.id_pengajaran || "");
    const tanggal = String(req.body?.tanggal || "").trim();
    const siswaList = Array.isArray(req.body?.siswa) ? req.body.siswa : [];

    if (!idPengajaran || !tanggal || siswaList.length === 0) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Kelas/mapel, tanggal, dan data siswa wajib diisi." });
    }

    const pengajaran = await ambilPengajaranMilikGuru(req, idPengajaran);
    if (!pengajaran) {
      await t.rollback();
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const statusValid = ["hadir", "sakit", "izin", "alpa"];
    if (siswaList.some((s) => !statusValid.includes(s.status))) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Status kehadiran tidak valid." });
    }

    const [sesi] = await AbsenKelas.findOrCreate({
      where: { id_pengajaran: idPengajaran, tanggal },
      transaction: t,
    });

    await AbsenKelasDetail.destroy({ where: { id_absen_kelas: sesi.id_absen_kelas }, transaction: t });

    await AbsenKelasDetail.bulkCreate(
      siswaList.map((s) => ({
        id_absen_kelas: sesi.id_absen_kelas,
        id_siswa: s.id_siswa,
        status: s.status,
        keterangan: String(s.keterangan || "").trim() || null,
      })),
      { transaction: t }
    );

    await sesi.update({ updated_at: new Date() }, { transaction: t });
    await t.commit();

    return res.status(200).json({ status: "success", message: "Absensi berhasil disimpan." });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ status: "error", message: "Gagal menyimpan absensi.", error: error.message });
  }
};

const rekapAbsen = async (req, res) => {
  try {
    const { id_pengajaran } = req.query;

    const pengajaran = await ambilPengajaranMilikGuru(req, id_pengajaran);
    if (!pengajaran) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const roster = await ambilRosterKelas(pengajaran);

    const sesiList = await AbsenKelas.findAll({
      where: { id_pengajaran },
      include: [{ model: AbsenKelasDetail, as: "detail" }],
    });

    const totalSesi = sesiList.length;
    const rekapMap = new Map();
    roster.forEach((s) => rekapMap.set(s.id_siswa, { hadir: 0, sakit: 0, izin: 0, alpa: 0 }));

    sesiList.forEach((sesi) => {
      (sesi.detail || []).forEach((d) => {
        const rekap = rekapMap.get(d.id_siswa);
        if (rekap) rekap[d.status] += 1;
      });
    });

    const data = roster.map((s) => ({ ...s, total_sesi: totalSesi, ...rekapMap.get(s.id_siswa) }));

    return res.status(200).json({ status: "success", message: "Rekap absen berhasil diambil.", data, total_sesi: totalSesi });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil rekap absen.", error: error.message });
  }
};

const hapusSesi = async (req, res) => {
  try {
    const sesi = await AbsenKelas.findByPk(req.params.id);

    if (!sesi || !(await ambilPengajaranMilikGuru(req, sesi.id_pengajaran))) {
      return res.status(404).json({ status: "error", message: "Data absen tidak ditemukan." });
    }

    await AbsenKelasDetail.destroy({ where: { id_absen_kelas: sesi.id_absen_kelas } });
    await sesi.destroy();

    return res.status(200).json({ status: "success", message: "Sesi absen berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus sesi absen.", error: error.message });
  }
};

module.exports = { daftarRiwayat, rosterAbsen, simpanAbsen, rekapAbsen, hapusSesi };
