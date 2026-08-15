const { Tugas, TugasSoal, PembagianMengajar, MataPelajaran, BankSoal } = require("../models");

async function ambilPengajaranMilikGuru(req, idPengajaran) {
  return PembagianMengajar.findOne({ where: { id_pengajaran: idPengajaran, id_user: req.user.userId } });
}

async function ambilTugasMilikGuru(req, idTugas) {
  const tugas = await Tugas.findByPk(idTugas);
  if (!tugas) return null;
  const pengajaran = await ambilPengajaranMilikGuru(req, tugas.id_pengajaran);
  return pengajaran ? tugas : null;
}

const daftarTugas = async (req, res) => {
  try {
    const pengajaranList = await PembagianMengajar.findAll({
      where: { id_user: req.user.userId },
      attributes: ["id_pengajaran"],
    });
    const idPengajaranList = pengajaranList.map((p) => p.id_pengajaran);

    const rows = idPengajaranList.length
      ? await Tugas.findAll({
          where: { id_pengajaran: idPengajaranList },
          include: [
            {
              model: PembagianMengajar,
              as: "pengajaran",
              attributes: ["tingkat", "nama_kelas"],
              include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
            },
            { model: TugasSoal, as: "tugas_soal", attributes: ["id_tugas_soal"] },
          ],
          order: [["created_at", "DESC"]],
        })
      : [];

    const data = rows.map((row) => ({
      ...row.toJSON(),
      jumlah_soal: row.tugas_soal?.length || 0,
    }));

    return res.status(200).json({ status: "success", message: "Daftar tugas berhasil diambil.", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar tugas.", error: error.message });
  }
};

const buatTugas = async (req, res) => {
  try {
    const idPengajaran = String(req.body?.id_pengajaran || "");
    const judul = String(req.body?.judul || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const deadline = String(req.body?.deadline || "").trim() || null;
    const status = String(req.body?.status || "draft");
    const semester = String(req.body?.semester || "ganjil");

    if (!idPengajaran || !judul) {
      return res.status(400).json({ status: "error", message: "Kelas/mapel dan judul wajib diisi." });
    }

    if (!["draft", "terbit"].includes(status) || !["ganjil", "genap"].includes(semester)) {
      return res.status(400).json({ status: "error", message: "Status atau semester tidak valid." });
    }

    if (!(await ambilPengajaranMilikGuru(req, idPengajaran))) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const row = await Tugas.create({ id_pengajaran: idPengajaran, judul, deskripsi, deadline, status, semester });

    return res.status(201).json({ status: "success", message: "Tugas berhasil ditambahkan.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menambahkan tugas.", error: error.message });
  }
};

const updateTugas = async (req, res) => {
  try {
    const row = await ambilTugasMilikGuru(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Tugas tidak ditemukan." });
    }

    const judul = String(req.body?.judul || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const deadline = String(req.body?.deadline || "").trim() || null;
    const status = String(req.body?.status || row.status);
    const semester = String(req.body?.semester || row.semester);

    if (!judul) {
      return res.status(400).json({ status: "error", message: "Judul wajib diisi." });
    }

    if (!["draft", "terbit"].includes(status) || !["ganjil", "genap"].includes(semester)) {
      return res.status(400).json({ status: "error", message: "Status atau semester tidak valid." });
    }

    await row.update({ judul, deskripsi, deadline, status, semester });

    return res.status(200).json({ status: "success", message: "Tugas berhasil diubah.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengubah tugas.", error: error.message });
  }
};

const hapusTugas = async (req, res) => {
  try {
    const row = await ambilTugasMilikGuru(req, req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Tugas tidak ditemukan." });
    }

    await TugasSoal.destroy({ where: { id_tugas: row.id_tugas } });
    await row.destroy();

    return res.status(200).json({ status: "success", message: "Tugas berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus tugas.", error: error.message });
  }
};

const daftarSoalTugas = async (req, res) => {
  try {
    const tugas = await ambilTugasMilikGuru(req, req.params.id);

    if (!tugas) {
      return res.status(404).json({ status: "error", message: "Tugas tidak ditemukan." });
    }

    const rows = await TugasSoal.findAll({
      where: { id_tugas: tugas.id_tugas },
      include: [{ model: BankSoal, as: "soal", attributes: ["pertanyaan", "tipe_soal"] }],
      order: [["nomor", "ASC"]],
    });

    return res.status(200).json({ status: "success", message: "Daftar soal tugas berhasil diambil.", data: rows });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar soal tugas.", error: error.message });
  }
};

const tambahSoalTugas = async (req, res) => {
  try {
    const tugas = await ambilTugasMilikGuru(req, req.params.id);

    if (!tugas) {
      return res.status(404).json({ status: "error", message: "Tugas tidak ditemukan." });
    }

    const idSoal = String(req.body?.id_soal || "");
    const bobot = Number(req.body?.bobot) || 1;

    if (!idSoal) {
      return res.status(400).json({ status: "error", message: "Pilih soal terlebih dahulu." });
    }

    const soal = await BankSoal.findOne({ where: { id_soal: idSoal, dibuat_oleh: req.user.userId } });
    if (!soal) {
      return res.status(404).json({ status: "error", message: "Soal tidak ditemukan." });
    }

    const sudahAda = await TugasSoal.findOne({ where: { id_tugas: tugas.id_tugas, id_soal: idSoal } });
    if (sudahAda) {
      return res.status(400).json({ status: "error", message: "Soal ini sudah ada di tugas." });
    }

    const jumlah = await TugasSoal.count({ where: { id_tugas: tugas.id_tugas } });

    const row = await TugasSoal.create({ id_tugas: tugas.id_tugas, id_soal: idSoal, nomor: jumlah + 1, bobot });

    return res.status(201).json({ status: "success", message: "Soal berhasil ditambahkan ke tugas.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menambahkan soal ke tugas.", error: error.message });
  }
};

const hapusSoalTugas = async (req, res) => {
  try {
    const row = await TugasSoal.findByPk(req.params.idTugasSoal);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Soal tugas tidak ditemukan." });
    }

    const tugas = await ambilTugasMilikGuru(req, row.id_tugas);
    if (!tugas) {
      return res.status(403).json({ status: "error", message: "Tugas ini bukan milik Anda." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Soal berhasil dihapus dari tugas." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus soal dari tugas.", error: error.message });
  }
};

module.exports = {
  daftarTugas,
  buatTugas,
  updateTugas,
  hapusTugas,
  daftarSoalTugas,
  tambahSoalTugas,
  hapusSoalTugas,
};
