const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ke konfigurasi database benar
const KategoriSoal = require('./KategoriSoal'); // Pastikan model KategoriSoal sudah dibuat

const Soal = sequelize.define('Soal', {
  id_soal: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  id_kategori: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  soal: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  gambar: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'soal',
  timestamps: false,
  underscored: true,
});

// Relasi
Soal.belongsTo(KategoriSoal, {
  foreignKey: 'id_kategori',
  as: 'kategori_soal',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

module.exports = Soal;
