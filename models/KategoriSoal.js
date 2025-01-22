const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ke konfigurasi database benar
const MataPelajaran = require('./MataPelajaran'); // Pastikan model MataPelajaran sudah dibuat
const User = require('./User'); // Pastikan model User sudah dibuat

const KategoriSoal = sequelize.define('KategoriSoal', {
  id_kategori: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  id_mapel: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: MataPelajaran,
      key: 'id_mapel',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  id_user: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  nama_kategori: {
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
  tableName: 'kategori_soal',
  timestamps: false,
  underscored: true,
});

// Definisi Relasi
KategoriSoal.belongsTo(MataPelajaran, {
  foreignKey: 'id_mapel',
  as: 'mata_pelajaran',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

KategoriSoal.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'user',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

module.exports = KategoriSoal;
