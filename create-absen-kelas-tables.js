'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const existing = await queryInterface.showAllTables();

    if (!existing.includes('absen_kelas')) {
      await db.sequelize.query(`
        CREATE TABLE absen_kelas (
          id_absen_kelas CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_pengajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          tanggal DATE NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_absen_kelas),
          UNIQUE KEY uq_absen_kelas (id_pengajaran, tanggal)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel absen_kelas berhasil dibuat.');
    } else {
      console.log('Tabel absen_kelas sudah ada, tidak dibuat ulang.');
    }

    if (!existing.includes('absen_kelas_detail')) {
      await db.sequelize.query(`
        CREATE TABLE absen_kelas_detail (
          id_detail CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_absen_kelas CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          status ENUM('hadir', 'sakit', 'izin', 'alpa') NOT NULL DEFAULT 'hadir',
          keterangan VARCHAR(255) NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id_detail),
          KEY idx_detail_absen_kelas (id_absen_kelas),
          UNIQUE KEY uq_detail_siswa (id_absen_kelas, id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel absen_kelas_detail berhasil dibuat.');
    } else {
      console.log('Tabel absen_kelas_detail sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel absen kelas:', error.message);
    process.exit(1);
  }
})();
