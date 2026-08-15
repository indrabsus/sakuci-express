// "jurusan" belum jadi tabel master di sistem ini - riwayat_kelas cuma
// menyimpan nama_kelas bebas teks (mis. "PPLG 1", "AKL 2"). Jurusan siswa
// diturunkan dari token pertama nama_kelas, termasuk kode lama sebelum
// rebranding kurikulum SMK (AK -> AKL, RPL -> PPLG, BDP -> PM).
const JURUSAN_LIST = [
  { kode: "AKL", nama: "Akuntansi dan Keuangan Lembaga" },
  { kode: "MPLB", nama: "Manajemen Perkantoran dan Layanan Bisnis" },
  { kode: "PM", nama: "Pemasaran" },
  { kode: "PPLG", nama: "Pengembangan Perangkat Lunak dan Gim" },
];

const JURUSAN_ALIASES = {
  AKL: ["AKL", "AK"],
  MPLB: ["MPLB"],
  PM: ["PM", "BDP"],
  PPLG: ["PPLG", "RPL"],
};

function resolveJurusanFromNamaKelas(namaKelas) {
  if (!namaKelas) return null;

  const kode = String(namaKelas).trim().split(/\s+/)[0].toUpperCase();

  for (const [jurusan, aliases] of Object.entries(JURUSAN_ALIASES)) {
    if (aliases.includes(kode)) return jurusan;
  }

  return null;
}

function jabatanKajur(kodeJurusan) {
  return kodeJurusan ? `Ketua Program Keahlian ${kodeJurusan}` : "Kepala Jurusan";
}

module.exports = { JURUSAN_LIST, resolveJurusanFromNamaKelas, jabatanKajur };
