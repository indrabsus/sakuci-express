const { ProjectSiswa, SiswaPpdb, RiwayatKelas } = require("../models");
const { resolveJurusanFromNamaKelas } = require("../utils/jurusan");
const { getTahunAjaranAktifNama, getIdTahunAjaran } = require("../utils/tahunAjaran");
const { getKajurJurusan } = require("../utils/kajurContext");

const daftarProjectKajur = async (req, res) => {
  try {
    const kodeJurusan = await getKajurJurusan(req);

    const rows = await ProjectSiswa.findAll({
      include: [{ model: SiswaPpdb, as: "siswa", attributes: ["nama_lengkap"] }],
      order: [["created_at", "DESC"]],
    });

    const namaTahunAktif = await getTahunAjaranAktifNama();
    const idTahunAjaran = await getIdTahunAjaran(namaTahunAktif);

    const idSiswaList = rows.map((r) => r.id_siswa);
    const riwayat = idTahunAjaran
      ? await RiwayatKelas.findAll({
          where: { id_siswa: idSiswaList, id_tahun_ajaran: idTahunAjaran },
        })
      : [];
    const kelasMap = new Map(riwayat.map((r) => [r.id_siswa, r]));

    const data = rows
      .map((row) => {
        const kelas = kelasMap.get(row.id_siswa);
        return {
          ...row.toJSON(),
          nama_siswa: row.siswa?.nama_lengkap || "-",
          kelas_nama: kelas ? `${kelas.tingkat} ${kelas.nama_kelas}` : null,
          jurusan: kelas ? resolveJurusanFromNamaKelas(kelas.nama_kelas) : null,
        };
      })
      .filter((row) => row.jurusan === kodeJurusan);

    return res.status(200).json({
      status: "success",
      message: "Daftar project siswa berhasil diambil.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar project siswa.",
      error: error.message,
    });
  }
};

const reviewProject = async (req, res) => {
  try {
    const status = String(req.body?.status || "");
    const catatan = String(req.body?.catatan_kajur || "").trim() || null;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ status: "error", message: "Status tidak valid." });
    }

    const row = await ProjectSiswa.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ status: "error", message: "Project tidak ditemukan." });
    }

    await row.update({
      status,
      catatan_kajur: catatan,
      direview_oleh: req.user.userId,
      direview_at: new Date(),
    });

    return res.status(200).json({
      status: "success",
      message: status === "approved" ? "Project disetujui." : "Project ditolak.",
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mereview project.", error: error.message });
  }
};

const daftarProjectSiswa = async (req, res) => {
  try {
    const rows = await ProjectSiswa.findAll({
      where: { id_siswa: req.user.id_data },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      message: "Daftar project berhasil diambil.",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengambil daftar project.", error: error.message });
  }
};

const buatProjectSiswa = async (req, res) => {
  try {
    const namaProject = String(req.body?.nama_project || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const linkYoutube = String(req.body?.link_youtube || "").trim() || null;

    if (!namaProject) {
      return res.status(400).json({ status: "error", message: "Nama project wajib diisi." });
    }

    const row = await ProjectSiswa.create({
      id_siswa: req.user.id_data,
      nama_project: namaProject,
      deskripsi,
      link_youtube: linkYoutube,
    });

    return res.status(201).json({
      status: "success",
      message: "Project berhasil ditambahkan.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menambahkan project.", error: error.message });
  }
};

const ubahProjectSiswa = async (req, res) => {
  try {
    const row = await ProjectSiswa.findOne({
      where: { id_project: req.params.id, id_siswa: req.user.id_data },
    });

    if (!row) {
      return res.status(404).json({ status: "error", message: "Project tidak ditemukan." });
    }

    const namaProject = String(req.body?.nama_project || "").trim();
    const deskripsi = String(req.body?.deskripsi || "").trim() || null;
    const linkYoutube = String(req.body?.link_youtube || "").trim() || null;

    if (!namaProject) {
      return res.status(400).json({ status: "error", message: "Nama project wajib diisi." });
    }

    // Project yang diedit perlu di-ACC ulang oleh kajur.
    await row.update({
      nama_project: namaProject,
      deskripsi,
      link_youtube: linkYoutube,
      status: "pending",
      catatan_kajur: null,
    });

    return res.status(200).json({
      status: "success",
      message: "Project berhasil diubah dan menunggu ACC kajur kembali.",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal mengubah project.", error: error.message });
  }
};

const hapusProjectSiswa = async (req, res) => {
  try {
    const row = await ProjectSiswa.findOne({
      where: { id_project: req.params.id, id_siswa: req.user.id_data },
    });

    if (!row) {
      return res.status(404).json({ status: "error", message: "Project tidak ditemukan." });
    }

    await row.destroy();

    return res.status(200).json({ status: "success", message: "Project berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Gagal menghapus project.", error: error.message });
  }
};

module.exports = {
  daftarProjectKajur,
  reviewProject,
  daftarProjectSiswa,
  buatProjectSiswa,
  ubahProjectSiswa,
  hapusProjectSiswa,
};
