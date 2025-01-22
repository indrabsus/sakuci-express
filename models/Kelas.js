// Kelas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Jurusan = require('./Jurusan');
const DataSiswa = require('./DataSiswa');

const Kelas = sequelize.define('Kelas', {
  id_kelas: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  nama_kelas: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_jurusan: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jurusan',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  id_user: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  id_angkatan: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'angkatan',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  tingkat: {
    type: DataTypes.BIGINT,
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
  tableName: 'kelas',
  timestamps: false,
  underscored: true,
});

// Definisi Relasi
// Kelas.hasMany(DataSiswa, { foreignKey: 'id_kelas', as: 'dataSiswa' });
Kelas.belongsTo(Jurusan, { foreignKey: 'id_jurusan', as: 'jurusan' });

module.exports = Kelas;
