'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('informasi_sekolah')) {
      await db.sequelize.query(`
        CREATE TABLE informasi_sekolah (
          id_sekolah CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nama_sekolah VARCHAR(255) NOT NULL,
          alamat TEXT NULL,
          email VARCHAR(255) NULL,
          instagram VARCHAR(255) NULL,
          no_telepon VARCHAR(50) NULL,
          nama_kepala_sekolah VARCHAR(255) NULL,
          nip_kepala_sekolah VARCHAR(100) NULL,
          visi TEXT NULL,
          misi TEXT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_sekolah)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel informasi_sekolah berhasil dibuat.');
    } else {
      console.log('Tabel informasi_sekolah sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel informasi_sekolah:', error.message);
    process.exit(1);
  }
})();
