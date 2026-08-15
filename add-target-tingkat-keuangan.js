'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('keuangan_kategori');

    if (!columns.target_tingkat) {
      await db.sequelize.query(
        `ALTER TABLE keuangan_kategori ADD COLUMN target_tingkat VARCHAR(20) NULL AFTER target_nominal;`
      );
      console.log('Kolom target_tingkat berhasil ditambahkan.');
    } else {
      console.log('Kolom target_tingkat sudah ada, tidak ditambahkan ulang.');
    }

    const [affected] = await db.sequelize.query(
      `UPDATE keuangan_kategori SET target_tingkat = '10,11,12' WHERE target_tingkat IS NULL`
    );
    console.log(`Backfill target_tingkat='10,11,12' untuk kategori lama (affected: ${JSON.stringify(affected)}).`);

    await db.sequelize.query(
      `ALTER TABLE keuangan_kategori MODIFY COLUMN target_tingkat VARCHAR(20) NOT NULL;`
    );
    console.log('Kolom target_tingkat sekarang NOT NULL.');

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal migrasi kolom target_tingkat:', error.message);
    process.exit(1);
  }
})();
