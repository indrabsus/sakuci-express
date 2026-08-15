'use strict';
require('dotenv').config();
const db = require('./models');

const TABLES = [
  {
    name: 'pembagian_mengajar',
    sql: `
      CREATE TABLE pembagian_mengajar (
        id_pengajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_user CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_mapel CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_tahun_ajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        tingkat VARCHAR(10) NOT NULL,
        nama_kelas VARCHAR(100) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id_pengajaran),
        KEY idx_pengajaran_user (id_user),
        UNIQUE KEY uq_pengajaran (id_user, id_mapel, id_tahun_ajaran, tingkat, nama_kelas)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'materi_ajar',
    sql: `
      CREATE TABLE materi_ajar (
        id_materi CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_pengajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT NULL,
        tanggal DATE NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id_materi),
        KEY idx_materi_pengajaran (id_pengajaran)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'bank_soal',
    sql: `
      CREATE TABLE bank_soal (
        id_soal CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_mapel CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        tipe_soal ENUM('pg', 'essay') NOT NULL DEFAULT 'pg',
        pertanyaan TEXT NOT NULL,
        tingkat_kesulitan ENUM('mudah', 'sedang', 'sulit') NULL,
        pembahasan TEXT NULL,
        dibuat_oleh CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        nama_pembuat VARCHAR(255) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id_soal),
        KEY idx_soal_mapel (id_mapel)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'opsi_jawaban',
    sql: `
      CREATE TABLE opsi_jawaban (
        id_opsi CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_soal CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        label VARCHAR(10) NOT NULL,
        isi_opsi TEXT NOT NULL,
        is_benar TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id_opsi),
        KEY idx_opsi_soal (id_soal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'tugas',
    sql: `
      CREATE TABLE tugas (
        id_tugas CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_pengajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT NULL,
        deadline DATETIME NULL,
        status ENUM('draft', 'terbit') NOT NULL DEFAULT 'draft',
        semester ENUM('ganjil', 'genap') NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id_tugas),
        KEY idx_tugas_pengajaran (id_pengajaran)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'tugas_soal',
    sql: `
      CREATE TABLE tugas_soal (
        id_tugas_soal CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_tugas CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        id_soal CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        nomor INT NOT NULL,
        bobot INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id_tugas_soal),
        KEY idx_tugas_soal_tugas (id_tugas),
        UNIQUE KEY uq_tugas_soal (id_tugas, id_soal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
];

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const existing = await queryInterface.showAllTables();

    for (const table of TABLES) {
      if (!existing.includes(table.name)) {
        await db.sequelize.query(table.sql);
        console.log(`Tabel ${table.name} berhasil dibuat.`);
      } else {
        console.log(`Tabel ${table.name} sudah ada, tidak dibuat ulang.`);
      }
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel akademik guru:', error.message);
    process.exit(1);
  }
})();
