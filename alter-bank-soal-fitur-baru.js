'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();

    const soalColumns = await queryInterface.describeTable('bank_soal');

    if (!soalColumns.gambar_url) {
      await db.sequelize.query(`ALTER TABLE bank_soal ADD COLUMN gambar_url VARCHAR(255) NULL AFTER pertanyaan;`);
      console.log('bank_soal.gambar_url ditambahkan.');
    }

    if (!soalColumns.daftar_kategori) {
      await db.sequelize.query(`ALTER TABLE bank_soal ADD COLUMN daftar_kategori VARCHAR(500) NULL AFTER tipe_soal;`);
      console.log('bank_soal.daftar_kategori ditambahkan.');
    }

    await db.sequelize.query(
      `ALTER TABLE bank_soal MODIFY COLUMN tipe_soal ENUM('pg_tunggal','pg_mcma','pg_kategori','essay') NOT NULL DEFAULT 'pg_tunggal';`
    );
    console.log('bank_soal.tipe_soal enum diperbarui.');

    await db.sequelize.query(
      `ALTER TABLE bank_soal MODIFY COLUMN tingkat_kesulitan ENUM('mudah','sedang','sulit') NOT NULL DEFAULT 'sedang';`
    );
    console.log('bank_soal.tingkat_kesulitan default diperbarui ke sedang.');

    const opsiColumns = await queryInterface.describeTable('opsi_jawaban');

    if (!opsiColumns.gambar_url) {
      await db.sequelize.query(`ALTER TABLE opsi_jawaban ADD COLUMN gambar_url VARCHAR(255) NULL AFTER isi_opsi;`);
      console.log('opsi_jawaban.gambar_url ditambahkan.');
    }

    if (!opsiColumns.kategori) {
      await db.sequelize.query(`ALTER TABLE opsi_jawaban ADD COLUMN kategori VARCHAR(100) NULL AFTER gambar_url;`);
      console.log('opsi_jawaban.kategori ditambahkan.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal migrasi fitur baru bank soal:', error.message);
    process.exit(1);
  }
})();
