const { LogAktivitas } = require('../models');

// Dipanggil setelah aksi utama (create/update/delete) berhasil - kegagalan
// mencatat log tidak boleh menggagalkan aksi utama, jadi error di sini cukup
// di-console.error saja, tidak dilempar ke pemanggil.
const catatLogAktivitas = async (
  req,
  { modul, aksi, keterangan, data_sebelum = null, data_sesudah = null }
) => {
  try {
    await LogAktivitas.create({
      username: req.user?.username || null,
      modul,
      aksi,
      keterangan,
      data_sebelum,
      data_sesudah,
    });
  } catch (error) {
    console.error('Gagal mencatat log aktivitas:', error.message);
  }
};

module.exports = catatLogAktivitas;
