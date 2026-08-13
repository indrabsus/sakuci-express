const { TahunAjaran } = require('../models');

// Tahun ajaran aktif ditandai manual lewat is_aktif (bukan ditebak dari
// string terbesar lagi), supaya admin bisa mengatur sendiri lewat menu
// Tahun Ajaran.
async function getTahunAjaranAktifNama() {
  const row = await TahunAjaran.findOne({ where: { is_aktif: true } });
  return row ? row.nama : null;
}

async function getIdTahunAjaran(nama) {
  if (!nama) return null;
  const row = await TahunAjaran.findOne({ where: { nama } });
  return row ? row.id_tahun_ajaran : null;
}

// Dipakai di endpoint yang menerima input tahun_ajaran bebas teks dari
// frontend (mis. datalist di admin-zakola) - kalau labelnya belum ada di
// tabel tahun_ajaran, dibuatkan otomatis supaya alur input tidak putus.
async function getOrCreateIdTahunAjaran(nama) {
  if (!nama) return null;
  const [row] = await TahunAjaran.findOrCreate({ where: { nama } });
  return row.id_tahun_ajaran;
}

module.exports = {
  getTahunAjaranAktifNama,
  getIdTahunAjaran,
  getOrCreateIdTahunAjaran,
};
