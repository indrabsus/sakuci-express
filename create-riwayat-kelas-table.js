'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.includes('riwayat_kelas')) {
      console.log('Tabel riwayat_kelas sudah ada, tidak ada perubahan.');
    } else {
      // Dibuat pakai SQL mentah (bukan queryInterface.createTable) supaya kolom
      // id_siswa persis sama charset/collation-nya dengan siswa_ppdb.id_siswa
      // (utf8mb4_unicode_ci, tanpa atribut BINARY yang otomatis ditambah Sequelize
      // untuk DataTypes.UUID) -- kalau beda, MySQL menolak bikin foreign key-nya.
      await db.sequelize.query(`
        CREATE TABLE riwayat_kelas (
          id_riwayat CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          tahun_ajaran VARCHAR(255) NOT NULL,
          tingkat VARCHAR(255) NOT NULL,
          nama_kelas VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id_riwayat),
          UNIQUE KEY riwayat_kelas_siswa_tahun_unique (id_siswa, tahun_ajaran),
          CONSTRAINT riwayat_kelas_id_siswa_fk
            FOREIGN KEY (id_siswa) REFERENCES siswa_ppdb (id_siswa)
            ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('Tabel riwayat_kelas berhasil dibuat.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel riwayat_kelas:', error);
    process.exit(1);
  }
})();
