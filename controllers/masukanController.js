const { Op, fn, col, literal, Sequelize, where  } = require('sequelize');
const {User, Masukan} = require('../models');
const moment = require('moment-timezone');


// Fungsi cekUsername
const cekUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const data = await User.findOne({
      where: { username },
    });

    if (data) {
      return res.status(200).json({ data, status: 200 });
    }
    return res.status(404).json({ message: 'Data tidak ditemukan' });
  } catch (error) {
    console.error('Error cekUsername:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};


// Fungsi prosesAgenda
const prosesMasukan = async (req, res) => {
  try {
    const { id, kategori, masukan, no_hp } = req.body;

    await Masukan.create({
      id_user: id,
      kategori,
      masukan,
      gambar: 'null',
      status: 0,
      anonim: 'n',
      no_hp
    });

    return res.status(200).json({ message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error prosesAgenda:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};


module.exports = { cekUsername, prosesMasukan };
