'use strict';
require('dotenv').config();
const db = require('./models'); // Pastikan path ke index.js benar

(async () => {
  try {
    // Cek koneksi ke database
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Log model yang terdeteksi
    console.log('Loaded models:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

    // Misalnya, jika Anda memiliki model User
    if (db.JurusanPpdb) {
      const users = await db.JurusanPpdb.findAll();
      console.log('Users:', users);
    } else {
      console.log('No User model found.');
    }

    await db.sequelize.close(); // Tutup koneksi setelah selesai
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
