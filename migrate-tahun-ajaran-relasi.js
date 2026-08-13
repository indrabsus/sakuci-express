'use strict';
require('dotenv').config();
const db = require('./models');

// Tahun ajaran string terbesar (lexicographic = kronologis untuk format
// "YYYY/YYYY") dianggap aktif kalau belum ada yang ditandai aktif secara manual.
const TAHUN_AJARAN_AKTIF_DEFAULT = '2026/2027';

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    // 1. Buat tabel tahun_ajaran
    if (!tables.includes('tahun_ajaran')) {
      await db.sequelize.query(`
        CREATE TABLE tahun_ajaran (
          id_tahun_ajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          nama VARCHAR(255) NOT NULL,
          is_aktif TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (id_tahun_ajaran),
          UNIQUE KEY tahun_ajaran_nama_unique (nama)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('Tabel tahun_ajaran berhasil dibuat.');
    } else {
      console.log('Tabel tahun_ajaran sudah ada, tidak dibuat ulang.');
    }

    // 2. Seed dari nilai string yang ada di riwayat_kelas
    const [existingRows] = await db.sequelize.query(
      'SELECT DISTINCT tahun_ajaran FROM riwayat_kelas ORDER BY tahun_ajaran ASC'
    );

    for (const row of existingRows) {
      const nama = row.tahun_ajaran;
      const [found] = await db.sequelize.query(
        'SELECT id_tahun_ajaran FROM tahun_ajaran WHERE nama = ?',
        { replacements: [nama] }
      );

      if (found.length === 0) {
        const isAktif = nama === TAHUN_AJARAN_AKTIF_DEFAULT;
        await db.sequelize.query(
          `INSERT INTO tahun_ajaran (id_tahun_ajaran, nama, is_aktif, created_at, updated_at)
           VALUES (UUID(), ?, ?, NOW(), NOW())`,
          { replacements: [nama, isAktif ? 1 : 0] }
        );
        console.log(`Seed tahun_ajaran "${nama}" (aktif: ${isAktif}) berhasil.`);
      } else {
        console.log(`tahun_ajaran "${nama}" sudah ada, dilewati.`);
      }
    }

    // Pastikan minimal satu baris aktif (fallback ke yang terbaru kalau belum ada)
    const [aktifRows] = await db.sequelize.query(
      'SELECT id_tahun_ajaran FROM tahun_ajaran WHERE is_aktif = 1'
    );
    if (aktifRows.length === 0) {
      await db.sequelize.query(
        'UPDATE tahun_ajaran SET is_aktif = 1 WHERE nama = (SELECT nama FROM (SELECT MAX(nama) AS nama FROM tahun_ajaran) t)'
      );
      console.log('Tidak ada tahun_ajaran aktif, fallback ke nama terbesar sebagai aktif.');
    }

    // 3. Tambah kolom id_tahun_ajaran ke riwayat_kelas (kalau belum ada)
    const kolomRiwayat = await queryInterface.describeTable('riwayat_kelas');

    if (!kolomRiwayat.id_tahun_ajaran) {
      await db.sequelize.query(`
        ALTER TABLE riwayat_kelas
        ADD COLUMN id_tahun_ajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER tahun_ajaran;
      `);
      console.log('Kolom id_tahun_ajaran berhasil ditambahkan ke riwayat_kelas.');
    } else {
      console.log('Kolom id_tahun_ajaran sudah ada di riwayat_kelas.');
    }

    // 4. Backfill id_tahun_ajaran berdasarkan nilai tahun_ajaran (string) yang ada
    await db.sequelize.query(`
      UPDATE riwayat_kelas rk
      JOIN tahun_ajaran ta ON ta.nama = rk.tahun_ajaran
      SET rk.id_tahun_ajaran = ta.id_tahun_ajaran
      WHERE rk.id_tahun_ajaran IS NULL;
    `);

    const [[{ belumTerisi }]] = await db.sequelize.query(
      'SELECT COUNT(*) AS belumTerisi FROM riwayat_kelas WHERE id_tahun_ajaran IS NULL'
    );

    if (Number(belumTerisi) > 0) {
      throw new Error(
        `Masih ada ${belumTerisi} baris riwayat_kelas tanpa id_tahun_ajaran setelah backfill. Migrasi dihentikan, kolom tahun_ajaran lama TIDAK dihapus.`
      );
    }

    console.log('Backfill id_tahun_ajaran ke riwayat_kelas selesai, semua baris terisi.');

    // 5. Kunci NOT NULL + FK constraint + index (kalau belum ada)
    const fkRows = await db.sequelize.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'riwayat_kelas'
       AND CONSTRAINT_NAME = 'riwayat_kelas_id_tahun_ajaran_fk'`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (fkRows.length === 0) {
      await db.sequelize.query(`
        ALTER TABLE riwayat_kelas
        MODIFY COLUMN id_tahun_ajaran CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        ADD CONSTRAINT riwayat_kelas_id_tahun_ajaran_fk
          FOREIGN KEY (id_tahun_ajaran) REFERENCES tahun_ajaran (id_tahun_ajaran)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        ADD INDEX riwayat_kelas_id_tahun_ajaran_idx (id_tahun_ajaran);
      `);
      console.log('Kolom id_tahun_ajaran dikunci NOT NULL + FK constraint berhasil ditambahkan.');
    } else {
      console.log('FK constraint riwayat_kelas_id_tahun_ajaran_fk sudah ada.');
    }

    // 6. Drop unique lama (id_siswa, tahun_ajaran) & kolom string tahun_ajaran,
    //    ganti unique key ke (id_siswa, id_tahun_ajaran)
    const indexes = await queryInterface.showIndex('riwayat_kelas');
    const uniqueLamaAda = indexes.some((idx) => idx.name === 'riwayat_kelas_siswa_tahun_unique');
    const uniqueBaruAda = indexes.some((idx) => idx.name === 'riwayat_kelas_siswa_id_tahun_unique');

    // Tambah unique key baru DULU (sebelum drop yang lama) supaya FK
    // riwayat_kelas_id_siswa_fk tetap punya index pendukung yang diawali
    // id_siswa - kalau dibalik, MySQL menolak drop index lama.
    if (!uniqueBaruAda) {
      await db.sequelize.query(`
        ALTER TABLE riwayat_kelas
        ADD UNIQUE KEY riwayat_kelas_siswa_id_tahun_unique (id_siswa, id_tahun_ajaran);
      `);
      console.log('Unique key baru (id_siswa, id_tahun_ajaran) berhasil ditambahkan.');
    }

    if (uniqueLamaAda) {
      await db.sequelize.query('ALTER TABLE riwayat_kelas DROP INDEX riwayat_kelas_siswa_tahun_unique;');
      console.log('Unique key lama (id_siswa, tahun_ajaran) dihapus.');
    }

    const kolomTerbaru = await queryInterface.describeTable('riwayat_kelas');
    if (kolomTerbaru.tahun_ajaran) {
      await db.sequelize.query('ALTER TABLE riwayat_kelas DROP COLUMN tahun_ajaran;');
      console.log('Kolom string tahun_ajaran lama berhasil dihapus dari riwayat_kelas.');
    }

    console.log('Migrasi relasi tahun_ajaran selesai.');

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal migrasi tahun_ajaran:', error.message);
    process.exit(1);
  }
})();
