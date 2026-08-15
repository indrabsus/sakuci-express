'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('sertifikat')) {
      await db.sequelize.query(`
        CREATE TABLE sertifikat (
          id_sertifikat CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nomor_sertifikat VARCHAR(100) NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          judul_manual VARCHAR(255) NOT NULL,
          jurusan VARCHAR(20) NULL,
          nilai INT NULL,
          diterbitkan_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          nama_kajur VARCHAR(255) NULL,
          status ENUM('aktif', 'dicabut') NOT NULL DEFAULT 'aktif',
          nama_kepsek VARCHAR(255) NULL,
          nip_kepsek VARCHAR(100) NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_sertifikat),
          UNIQUE KEY uq_nomor_sertifikat (nomor_sertifikat),
          KEY idx_sertifikat_siswa (id_siswa),
          KEY idx_sertifikat_jurusan (jurusan)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel sertifikat berhasil dibuat.');
    } else {
      console.log('Tabel sertifikat sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel sertifikat:', error.message);
    process.exit(1);
  }
})();
