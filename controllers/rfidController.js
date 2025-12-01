// controllers/rfidController.js
const { MasterRfid, SiswaPpdb, AbsenHarianSiswa, Temp } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { error } = require('qrcode-terminal');
const { create } = require('qrcode');

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

const getTemp = async (req, res) => {
  try {
    const data = await Temp.findOne({
      include: [{ model: MasterRfid, as: "master_rfid" }],
      order: [["created_at", "DESC"]], // ambil data paling baru
    });

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Data belum tersedia.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Data terakhir berhasil diambil.",
      data,
    });
  } catch (error) {
    console.error("Error getTemp:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan server.",
      error: error.message,
    });
  }
};

const deleteTemp = async (req, res) => {
  try {
    const {kode_mesin} = req.params;
    await Temp.destroy({ where: { kode_mesin: kode_mesin } });
    return res.status(200).json({ message: "Data berhasil dihapus." });
  } catch (error) {
    console.error("Error deleteTemp:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server.", error: error.message });
  }
};

const masterRfid = async (req, res) => {
  try {
    const {id_rfid} = req.params
    if(id_rfid){
      const data = await MasterRfid.findOne({
        where: {id_rfid}
      })
      if(!data){
      return res.status(404).json({
        message: "Data tidak ditemukan"
      })
    }
    return res.json({
      message: "Data ditemukan",
      data
    })
    }
    
    const data = await MasterRfid.findAll();
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

const createMaster = async(req, res) => {
  try {
    const { kode_mesin, fungsi, ip_address } = req.body;
    const data = await MasterRfid.create({
      kode_mesin,
      fungsi,
      ip_address
    })
    return res.json({
      message: "Data berhasil disimpan",
      data
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

const updateMaster = async(req, res) => {
  try {
    const { id_rfid } = req.params;
    const { kode_mesin, fungsi, ip_address } = req.body;
    const data = await MasterRfid.update({
      kode_mesin,
      fungsi,
      ip_address
    }, {
      where: {id_rfid}
    })
    return res.json({
      message: "Data berhasil diupdate",
      data
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

const deleteMaster = async(req, res) => {
  try {
    const { id_rfid } = req.params;
    const data = await MasterRfid.destroy({
      where: {id_rfid}
    })
    return res.json({
      message: "Data berhasil dihapus",
      data
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

module.exports = { rfidGlobal, getTemp, deleteTemp, masterRfid, createMaster, updateMaster, deleteMaster };