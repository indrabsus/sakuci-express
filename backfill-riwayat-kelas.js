'use strict';
require('dotenv').config();
const db = require('./models');

const TAHUN_AJARAN_BASELINE = '2025/2026';

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const siswaAktif = await db.SiswaPpdb.findAll({
      where: { status: 'aktif' },
      attributes: ['id_siswa'],
      include: [
        {
          model: db.SiswaBaru,
          as: 'siswa_baru',
          required: false,
          include: [
            {
              model: db.KelasPpdb,
              as: 'kelas_ppdb',
              attributes: ['tingkat', 'nama_kelas'],
            },
          ],
        },
      ],
    });

    const existing = await db.RiwayatKelas.findAll({
      where: { tahun_ajaran: TAHUN_AJARAN_BASELINE },
      attributes: ['id_siswa'],
      raw: true,
    });
    const existingIds = new Set(existing.map((item) => item.id_siswa));

    const rows = [];
    const tanpaKelas = [];

    for (const siswa of siswaAktif) {
      if (existingIds.has(siswa.id_siswa)) continue;

      const kelasPpdb = siswa.siswa_baru?.kelas_ppdb;

      if (!kelasPpdb) {
        tanpaKelas.push(siswa.id_siswa);
        continue;
      }

      rows.push({
        id_siswa: siswa.id_siswa,
        tahun_ajaran: TAHUN_AJARAN_BASELINE,
        // kelas_ppdb dianggap sudah merepresentasikan tingkat tahun ajaran
        // berjalan (2026/2027), jadi baseline 2025/2026 = tingkat itu - 1.
        tingkat: String(Number(kelasPpdb.tingkat) - 1),
        nama_kelas: kelasPpdb.nama_kelas,
      });
    }

    const CHUNK_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await db.RiwayatKelas.bulkCreate(chunk);
      inserted += chunk.length;
    }

    console.log(`Total siswa aktif: ${siswaAktif.length}`);
    console.log(`Sudah punya riwayat_kelas ${TAHUN_AJARAN_BASELINE}: ${existingIds.size}`);
    console.log(`Berhasil di-backfill: ${inserted}`);
    console.log(`Tanpa data kelas_ppdb (dilewati): ${tanpaKelas.length}`);

    if (tanpaKelas.length > 0) {
      console.log('id_siswa tanpa kelas_ppdb:', tanpaKelas.slice(0, 20));
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal backfill riwayat_kelas:', error);
    process.exit(1);
  }
})();
