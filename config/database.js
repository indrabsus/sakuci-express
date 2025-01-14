const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USERNAME;
const dbPass = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
// Konfigurasi koneksi Sequelize
const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
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
