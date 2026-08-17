'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const existing = await queryInterface.showAllTables();

    if (!existing.includes('pengumpulan_tugas')) {
      await db.sequelize.query(`
        CREATE TABLE pengumpulan_tugas (
          id_pengumpulan CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_tugas CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_siswa CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          status ENUM('dikerjakan', 'selesai', 'dinilai') NOT NULL DEFAULT 'dikerjakan',
          mulai_at DATETIME NOT NULL,
          selesai_at DATETIME NULL,
          nilai DECIMAL(5,2) NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_pengumpulan),
          KEY idx_pengumpulan_tugas (id_tugas),
          UNIQUE KEY uq_pengumpulan_siswa (id_tugas, id_siswa)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel pengumpulan_tugas berhasil dibuat.');
    } else {
      console.log('Tabel pengumpulan_tugas sudah ada, tidak dibuat ulang.');
    }

    if (!existing.includes('jawaban_tugas_siswa')) {
      await db.sequelize.query(`
        CREATE TABLE jawaban_tugas_siswa (
          id_jawaban CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_pengumpulan CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_soal CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          id_opsi CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
          jawaban_text TEXT NULL,
          is_benar TINYINT(1) NULL,
          nilai DECIMAL(5,2) NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id_jawaban),
          KEY idx_jawaban_pengumpulan (id_pengumpulan),
          KEY idx_jawaban_soal (id_soal)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel jawaban_tugas_siswa berhasil dibuat.');
    } else {
      console.log('Tabel jawaban_tugas_siswa sudah ada, tidak dibuat ulang.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel pengumpulan tugas:', error.message);
    process.exit(1);
  }
})();
