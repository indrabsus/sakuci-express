const { MateriAjar, PembagianMengajar, MataPelajaran } = require("../models");

async function ambilPengajaranMilikGuru(req, idPengajaran) {
  return PembagianMengajar.findOne({ where: { id_pengajaran: idPengajaran, id_user: req.user.userId } });
}

const daftarMateri = async (req, res) => {
  try {
    const { id_pengajaran } = req.query;

    let idPengajaranList;

    if (id_pengajaran) {
      if (!(await ambilPengajaranMilikGuru(req, id_pengajaran))) {
        return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
      }
      idPengajaranList = [id_pengajaran];
    } else {
      const pengajaranList = await PembagianMengajar.findAll({
        where: { id_user: req.user.userId },
        attributes: ["id_pengajaran"],
      });
      idPengajaranList = pengajaranList.map((p) => p.id_pengajaran);
    }

    const rows = idPengajaranList.length
      ? await MateriAjar.findAll({
          where: { id_pengajaran: idPengajaranList },
          include: [
            {
              model: PembagianMengajar,
              as: "pengajaran",
              attributes: ["tingkat", "nama_kelas"],
              include: [{ model: MataPelajaran, as: "mapel", attributes: ["nama_pelajaran"] }],
            },
          ],
          order: [["tanggal", "DESC"]],
        })
      : [];

    return res.status(200).json({ status: "success", message: "Daftar materi berhasil diambil.", data: rows });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar materi.", error: error.message });
  }
};

const buatMateri = async (req, res) => {
  try {
    const idPengajaran = String(req.body?.id_pengajaran || "");
    const judul = String(req.body?.judul || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const tanggal = String(req.body?.tanggal || "").trim();

    if (!idPengajaran || !judul || !tanggal) {
      return res.status(400).json({
        status: "error",
        message: "Kelas/mapel, judul, dan tanggal wajib diisi.",
      });
    }

    if (!(await ambilPengajaranMilikGuru(req, idPengajaran))) {
      return res.status(403).json({ status: "error", message: "Anda tidak mengajar kelas/mapel ini." });
    }

    const row = await MateriAjar.create({ id_pengajaran: idPengajaran, judul, deskripsi, tanggal });

    return res.status(201).json({ status: "success", message: "Materi berhasil ditambahkan.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menambahkan materi.", error: error.message });
  }
};

const updateMateri = async (req, res) => {
  try {
    const row = await MateriAjar.findByPk(req.params.id);

    if (!row || !(await ambilPengajaranMilikGuru(req, row.id_pengajaran))) {
      return res.status(404).json({ status: "error", message: "Materi tidak ditemukan." });
    }

    const judul = String(req.body?.judul || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const tanggal = String(req.body?.tanggal || "").trim();

    if (!judul || !tanggal) {
      return res.status(400).json({ status: "error", message: "Judul dan tanggal wajib diisi." });
    }

    await row.update({ judul, deskripsi, tanggal });

    return res.status(200).json({ status: "success", message: "Materi berhasil diubah.", data: row });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengubah materi.", error: error.message });
  }
};

const hapusMateri = async (req, res) => {
  try {
    const row = await MateriAjar.findByPk(req.params.id);

    if (!row || !(await ambilPengajaranMilikGuru(req, row.id_pengajaran))) {
      return res.status(404).json({ status: "error", message: "Materi tidak ditemukan." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Materi berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus materi.", error: error.message });
  }
};

module.exports = { daftarMateri, buatMateri, updateMateri, hapusMateri };
