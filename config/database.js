const { Sequelize } = require('sequelize');

// Konfigurasi koneksi Sequelize
const sequelize = new Sequelize('zakola_id', 'zakola_id', 'Sangkuriang2020@#@#', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true, // Aktifkan timestamps
    underscored: true, // Gunakan snake_case
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },// Nonaktifkan log query SQL (opsional)
});

// Ekspor instance Sequelize
module.exports = sequelize;
