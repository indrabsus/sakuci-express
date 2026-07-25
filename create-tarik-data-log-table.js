'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.includes('tarik_data_logs')) {
      console.log('Tabel tarik_data_logs sudah ada, tidak ada perubahan.');
    } else {
      await db.sequelize.query(`
        CREATE TABLE tarik_data_logs (
          id INT NOT NULL AUTO_INCREMENT,
          sumber ENUM('manual','terjadwal') NOT NULL,
          status ENUM('sukses','gagal') NOT NULL,
          pesan VARCHAR(255) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('Tabel tarik_data_logs berhasil dibuat.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel tarik_data_logs:', error);
    process.exit(1);
  }
})();
