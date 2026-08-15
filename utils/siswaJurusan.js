const { SiswaPpdb, RiwayatKelas } = require("../models");
const { resolveJurusanFromNamaKelas } = require("./jurusan");
const { getTahunAjaranAktifNama, getIdTahunAjaran } = require("./tahunAjaran");

// Siswa aktif di tahun ajaran aktif yang kelasnya cocok dengan jurusan kajur
// (jurusan diturunkan dari token pertama nama_kelas, lihat utils/jurusan.js).
async function getSiswaJurusanAktif(kodeJurusan) {
  if (!kodeJurusan) return [];

  const namaTahunAktif = await getTahunAjaranAktifNama();
  const idTahunAjaran = await getIdTahunAjaran(namaTahunAktif);
  if (!idTahunAjaran) return [];

  const riwayat = await RiwayatKelas.findAll({
    where: { id_tahun_ajaran: idTahunAjaran },
    include: [
      {
        model: SiswaPpdb,
        as: "siswa_ppdb",
        attributes: ["id_siswa", "nama_lengkap", "nisn", "status"],
        where: { status: "aktif" },
      },
    ],
    order: [["nama_kelas", "ASC"]],
  });

  return riwayat
    .filter((r) => resolveJurusanFromNamaKelas(r.nama_kelas) === kodeJurusan)
    .map((r) => ({
      id_siswa: r.siswa_ppdb.id_siswa,
      nama_lengkap: r.siswa_ppdb.nama_lengkap,
      nisn: r.siswa_ppdb.nisn,
      tingkat: r.tingkat,
      kelas: `${r.tingkat} ${r.nama_kelas}`,
    }));
}

module.exports = { getSiswaJurusanAktif };
