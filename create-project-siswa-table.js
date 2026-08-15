'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('project_siswa')) {
      await db.sequelize.query(`
        CREATE TABLE project_siswa (
          id_project CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nama_project VARCHAR(255) NOT NULL,
          deskripsi TEXT NULL,
          link_youtube VARCHAR(255) NULL,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          catatan_kajur TEXT NULL,
          direview_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          direview_at DATETIME NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_project),
          KEY idx_project_siswa (id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel project_siswa berhasil dibuat.');
    } else {
      console.log('Tabel project_siswa sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel project_siswa:', error.message);
    process.exit(1);
  }
})();
