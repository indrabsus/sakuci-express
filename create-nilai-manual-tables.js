'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const existing = await queryInterface.showAllTables();

    if (!existing.includes('nilai_manual')) {
      await db.sequelize.query(`
        CREATE TABLE nilai_manual (
          id_nilai_manual CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_pengajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          judul VARCHAR(255) NOT NULL,
          semester ENUM('ganjil', 'genap') NOT NULL DEFAULT 'ganjil',
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_nilai_manual),
          KEY idx_nilai_manual_pengajaran (id_pengajaran)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel nilai_manual berhasil dibuat.');
    } else {
      console.log('Tabel nilai_manual sudah ada, tidak dibuat ulang.');
    }

    if (!existing.includes('nilai_manual_detail')) {
      await db.sequelize.query(`
        CREATE TABLE nilai_manual_detail (
          id_detail CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_nilai_manual CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nilai DECIMAL(5,2) NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id_detail),
          KEY idx_detail_nilai_manual (id_nilai_manual),
          UNIQUE KEY uq_detail_siswa (id_nilai_manual, id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel nilai_manual_detail berhasil dibuat.');
    } else {
      console.log('Tabel nilai_manual_detail sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel nilai manual:', error.message);
    process.exit(1);
  }
})();
