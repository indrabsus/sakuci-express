'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.includes('log_aktivitas')) {
      console.log('Tabel log_aktivitas sudah ada, tidak ada perubahan.');
    } else {
      await db.sequelize.query(`
        CREATE TABLE log_aktivitas (
          id_log CHAR(36) NOT NULL,
          username VARCHAR(255) NULL,
          modul VARCHAR(100) NOT NULL,
          aksi ENUM('create','update','delete') NOT NULL,
          keterangan TEXT NOT NULL,
          data_sebelum JSON NULL,
          data_sesudah JSON NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_log),
          INDEX idx_log_aktivitas_modul (modul),
          INDEX idx_log_aktivitas_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('Tabel log_aktivitas berhasil dibuat.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel log_aktivitas:', error);
    process.exit(1);
  }
})();
