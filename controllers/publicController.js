const {
  InformasiSekolah,
  SiswaPpdb,
  DataUser,
  User,
  Sertifikat,
  ProjectSiswa,
  RiwayatKelas,
} = require("../models");
const { Op } = require("sequelize");
const { JURUSAN_LIST } = require("../utils/jurusan");
const { getTahunAjaranAktifNama, getIdTahunAjaran } = require("../utils/tahunAjaran");

// Data publik untuk landing page ("/") - tidak butuh login, jadi hanya
// mengekspos data yang memang layak tampil ke pengunjung umum.
const landingData = async (req, res) => {
  try {
    const [
      informasiSekolah,
      totalSiswa,
      totalGuru,
      kajurList,
      sertifikatList,
      projectList,
      totalSertifikat,
    ] = await Promise.all([
      InformasiSekolah.findOne({ order: [["created_at", "ASC"]] }),
      SiswaPpdb.count({ where: { status: "aktif" } }),
      DataUser.count({ include: [{ model: User, as: "user", where: { id_role: 6 }, attributes: [] }] }),
      DataUser.findAll({ where: { jurusan: { [Op.ne]: null } }, attributes: ["nama_lengkap", "jurusan"] }),
      Sertifikat.findAll({
        where: { status: "aktif" },
        include: [{ model: SiswaPpdb, as: "siswa", attributes: ["nama_lengkap"] }],
        order: [["created_at", "DESC"]],
        limit: 8,
      }),
      ProjectSiswa.findAll({
        where: { status: "approved" },
        include: [{ model: SiswaPpdb, as: "siswa", attributes: ["nama_lengkap"] }],
        order: [["created_at", "DESC"]],
        limit: 6,
      }),
      Sertifikat.count({ where: { status: "aktif" } }),
    ]);

    const ketuaMap = {};
    kajurList.forEach((k) => {
      if (!ketuaMap[k.jurusan]) ketuaMap[k.jurusan] = k.nama_lengkap;
    });

    const jurusan = JURUSAN_LIST.map((j) => ({ ...j, ketua: ketuaMap[j.kode] || null }));

    const idSiswaTerlibat = [
      ...sertifikatList.map((s) => s.id_siswa),
      ...projectList.map((p) => p.id_siswa),
    ];

    const namaTahunAktif = await getTahunAjaranAktifNama();
    const idTahunAjaran = await getIdTahunAjaran(namaTahunAktif);
    const riwayat = idTahunAjaran && idSiswaTerlibat.length
      ? await RiwayatKelas.findAll({
          where: { id_siswa: idSiswaTerlibat, id_tahun_ajaran: idTahunAjaran },
        })
      : [];
    const kelasMap = new Map(riwayat.map((r) => [r.id_siswa, `${r.tingkat} ${r.nama_kelas}`]));

    return res.status(200).json({
      status: "success",
      message: "Data landing page berhasil diambil.",
      data: {
        informasi_sekolah: informasiSekolah,
        stats: {
          siswa: totalSiswa,
          guru: totalGuru,
          jurusan: JURUSAN_LIST.length,
          sertifikat: totalSertifikat,
        },
        jurusan,
        sertifikat_terbaru: sertifikatList.map((s) => ({
          nama_siswa: s.siswa?.nama_lengkap || "-",
          kelas: kelasMap.get(s.id_siswa) || null,
          judul_manual: s.judul_manual,
        })),
        project_terbaru: projectList.map((p) => ({
          nama_siswa: p.siswa?.nama_lengkap || "-",
          kelas: kelasMap.get(p.id_siswa) || null,
          nama_project: p.nama_project,
          deskripsi: p.deskripsi,
          link_youtube: p.link_youtube,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil data landing page.",
      error: error.message,
    });
  }
};

// Verifikasi publik lewat kode di QR sertifikat - tidak butuh login.
const verifikasiSertifikat = async (req, res) => {
  try {
    const row = await Sertifikat.findOne({
      where: { kode_verifikasi: req.params.kode },
      include: [{ model: SiswaPpdb, as: "siswa", attributes: ["nama_lengkap"] }],
    });

    const valid = !!row && row.status === "aktif";

    return res.status(200).json({
      status: "success",
      message: "Verifikasi sertifikat berhasil diambil.",
      data: {
        valid,
        sertifikat: row
          ? {
              nama_siswa: row.siswa?.nama_lengkap || "-",
              judul_manual: row.judul_manual,
              nilai: row.nilai,
              nomor_sertifikat: row.nomor_sertifikat,
              tanggal_terbit: row.created_at,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal memverifikasi sertifikat.",
      error: error.message,
    });
  }
};

module.exports = { landingData, verifikasiSertifikat };
