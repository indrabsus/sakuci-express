'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('catatan_siswa')) {
      await db.sequelize.query(`
        CREATE TABLE catatan_siswa (
          id_catatan CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          tipe ENUM('positif', 'negatif') NOT NULL,
          catatan TEXT NOT NULL,
          dicatat_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          nama_pencatat VARCHAR(255) NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_catatan),
          KEY idx_catatan_siswa (id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel catatan_siswa berhasil dibuat.');
    } else {
      console.log('Tabel catatan_siswa sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel catatan_siswa:', error.message);
    process.exit(1);
  }
})();
