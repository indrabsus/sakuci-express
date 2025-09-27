// controllers/rfidController.js
const { MasterRfid, SiswaPpdb, AbsenHarianSiswa, Temp } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const rfidGlobal = async (req, res) => {
  try {
    const { norfid, kode_mesin } = req.params;

    // 🔎 cari mesin
    const mesin = await MasterRfid.findOne({ where: { kode_mesin } });
    if (!mesin) {
      return res.status(404).json({ message: 'Kode mesin tidak ditemukan' });
    }

    if (mesin.fungsi === 'absen') {
      // 🔎 cari siswa
      const siswa = await SiswaPpdb.findOne({ where: { no_rfid: norfid } });
      if (!siswa) {
        return res.status(404).json({ message: 'RFID tidak ditemukan' });
      }

      // 📅 tanggal hari ini
      const hariIni = dayjs().format('YYYY-MM-DD');

      // 🔎 cek duplikat absensi hari ini
      const duplikat = await AbsenHarianSiswa.findOne({
        where: {
          id_siswa: siswa.id_siswa,
          status: '0',
          waktu: {
            [Op.gte]: `${hariIni} 00:00:00`,
            [Op.lte]: `${hariIni} 23:59:59`
          }
        }
      });

      if (duplikat) {
        return res.status(409).json({
          message: 'Duplikat absensi: siswa sudah absen hari ini'
        });
      }

      // ✅ simpan absensi
      await AbsenHarianSiswa.create({
        id_siswa: siswa.id_siswa,
        status: '0',
        waktu: new Date()
      });

      return res.json({
        message: 'Absensi berhasil dicatat',
        siswa: siswa.nama_lengkap
      });
    } else {
      // ✅ simpan ke temp
      await Temp.create({
        no_rfid: norfid,
        kode_mesin: mesin.kode_mesin
      });

      return res.json({
        message: 'Data berhasil disimpan'
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = { rfidGlobal };