'use strict';
require('dotenv').config();
const db = require('./models');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    const queryInterface = db.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.includes('settings')) {
      console.log('Tabel settings sudah ada, tidak ada perubahan.');
    } else {
      await db.sequelize.query(`
        CREATE TABLE settings (
          id INT NOT NULL AUTO_INCREMENT,
          staf_boleh_edit_hapus TINYINT(1) NOT NULL DEFAULT 0,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('Tabel settings berhasil dibuat.');
    }

    await db.sequelize.close();
  } catch (error) {
    console.error('Gagal membuat tabel settings:', error);
    process.exit(1);
  }
})();
