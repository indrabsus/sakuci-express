'use strict';
require('dotenv').config();
const db = require('./models');

const KAJUR_JURUSAN = {
  'df8411a6-c476-4395-a146-878ddf3677c6': 'AKL', // Listia Meiliana Sari (kaprogakl)
  'b3c00df7-e780-4566-afc8-1038451760e9': 'MPLB', // Farida Tyas (kaprogmplb)
  'f5341ed3-8f00-4f26-b609-977bcf97bff4': 'PM', // Dewi Nuryawati (kaprogpm)
  'e0b85d6a-7893-43dc-8f01-de5dfb867966': 'PPLG', // Indra Batara (kaprogpplg)
};

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('data_user');

    if (!columns.jurusan) {
      await db.sequelize.query(
        `ALTER TABLE data_user ADD COLUMN jurusan VARCHAR(20) NULL AFTER gambar;`
      );
      console.log('Kolom jurusan berhasil ditambahkan ke data_user.');
    } else {
      console.log('Kolom jurusan sudah ada, tidak ditambahkan ulang.');
    }

    for (const [idData, jurusan] of Object.entries(KAJUR_JURUSAN)) {
      const [affected] = await db.sequelize.query(
        `UPDATE data_user SET jurusan = :jurusan WHERE id_data = :idData`,
        { replacements: { jurusan, idData } }
      );
      console.log(`Set jurusan=${jurusan} untuk id_data=${idData} (affected: ${affected})`);
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal migrasi kolom jurusan:', error.message);
    process.exit(1);
  }
})();
