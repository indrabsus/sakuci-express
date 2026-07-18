-- Tabel kelas_tahun: menyimpan kelas yang "ada" untuk suatu tahun ajaran
-- meskipun belum ada siswa yang dimasukkan (riwayat_kelas hanya berisi baris
-- kalau ada siswa). Diperlukan untuk fitur "Buat Kelas Baru" yang bisa
-- membuat kelas kosong dan "Tambah Tahun Ajaran" untuk tahun ajaran baru
-- yang belum punya data sama sekali.
--
-- Jalankan sekali di setiap environment (lokal & production) sebelum
-- men-deploy commit yang menyertakan file ini - proyek ini tidak memakai
-- migration framework, jadi perubahan skema dijalankan manual lewat file
-- SQL seperti ini.

CREATE TABLE IF NOT EXISTS kelas_tahun (
  id_kelas_tahun CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tahun_ajaran VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tingkat VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  nama_kelas VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id_kelas_tahun),
  UNIQUE KEY kelas_tahun_unique (tahun_ajaran, tingkat, nama_kelas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
