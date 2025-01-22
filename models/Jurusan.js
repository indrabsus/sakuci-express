const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path benar

const Jurusan = sequelize.define('Jurusan', {
  id_jurusan: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  nama_jurusan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  singkatan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'jurusan', // Pastikan nama tabel sesuai
  timestamps: false, // Karena Anda sudah menentukan `created_at` dan `updated_at`
  underscored: true, // Gunakan format snake_case
});

module.exports = Jurusan;
