const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Menyesuaikan dengan konfigurasi database Anda

const MasterPpdb = sequelize.define('master_ppdb', {
  id_ppdb: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, // UUID otomatis
  },
  daftar: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  ppdb: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  token_telegram: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  chat_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tahun: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'master_ppdb',
  timestamps: false, // Agar Sequelize tidak otomatis menambahkan field createdAt, updatedAt
});

// Synchronize the model with the database
// If you want to create the table, you can use sequelize.sync() in your main app file
// sequelize.sync({ force: true }); // Uncomment if you want to recreate the table

module.exports = MasterPpdb;
