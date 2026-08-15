'use strict';
require('dotenv').config();
const crypto = require('crypto');
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('sertifikat');

    if (!columns.kode_verifikasi) {
      await db.sequelize.query(
        `ALTER TABLE sertifikat ADD COLUMN kode_verifikasi VARCHAR(20) NULL AFTER nilai;`
      );
      console.log('Kolom kode_verifikasi berhasil ditambahkan ke sertifikat.');
    } else {
      console.log('Kolom kode_verifikasi sudah ada, tidak ditambahkan ulang.');
    }

    const [rows] = await db.sequelize.query(
      `SELECT id_sertifikat FROM sertifikat WHERE kode_verifikasi IS NULL`
    );

    for (const row of rows) {
      const kode = crypto.randomBytes(6).toString('hex').toUpperCase();
      await db.sequelize.query(
        `UPDATE sertifikat SET kode_verifikasi = :kode WHERE id_sertifikat = :id`,
        { replacements: { kode, id: row.id_sertifikat } }
      );
      console.log(`Backfill kode_verifikasi=${kode} untuk id_sertifikat=${row.id_sertifikat}`);
    }

    await db.sequelize.query(
      `ALTER TABLE sertifikat MODIFY COLUMN kode_verifikasi VARCHAR(20) NOT NULL, ADD UNIQUE KEY uq_kode_verifikasi (kode_verifikasi);`
    ).catch((err) => {
      console.log('Lewati constraint (mungkin sudah ada):', err.message);
    });

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal migrasi kolom kode_verifikasi:', error.message);
    process.exit(1);
  }
})();
