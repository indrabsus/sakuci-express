'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('keuangan_kategori')) {
      await db.sequelize.query(`
        CREATE TABLE keuangan_kategori (
          id_kategori CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          jurusan VARCHAR(20) NOT NULL,
          nama_kategori VARCHAR(255) NOT NULL,
          deskripsi TEXT NULL,
          target_nominal BIGINT NOT NULL,
          tenggat DATE NULL,
          status ENUM('aktif', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'aktif',
          dibuat_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_kategori),
          KEY idx_kategori_jurusan (jurusan)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel keuangan_kategori berhasil dibuat.');
    } else {
      console.log('Tabel keuangan_kategori sudah ada, tidak dibuat ulang.');
    }

    if (!tables.includes('keuangan_pembayaran')) {
      await db.sequelize.query(`
        CREATE TABLE keuangan_pembayaran (
          id_pembayaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_kategori CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nominal BIGINT NOT NULL,
          tanggal_bayar DATE NOT NULL,
          keterangan VARCHAR(255) NULL,
          dicatat_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          nama_pencatat VARCHAR(255) NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id_pembayaran),
          KEY idx_pembayaran_kategori (id_kategori),
          KEY idx_pembayaran_siswa (id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel keuangan_pembayaran berhasil dibuat.');
    } else {
      console.log('Tabel keuangan_pembayaran sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel keuangan siswa:', error.message);
    process.exit(1);
  }
})();
