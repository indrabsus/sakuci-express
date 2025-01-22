const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path benar

// Import model terkait
const MapelKelas = require('./MapelKelas'); // Pastikan path benar
const SoalUjian = require('./SoalUjian'); // Pastikan path benar

const Sumatif = sequelize.define('Sumatif', {
  id_sumatif: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  id_mapelkelas: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  id_soalujian: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nama_sumatif: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  waktu: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  tahun: {
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
  tableName: 'sumatif',
  timestamps: false,
  underscored: true,
});

// Definisi Relasi
Sumatif.belongsTo(MapelKelas, { foreignKey: 'id_mapelkelas', as: 'mapel_kelas', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
Sumatif.belongsTo(SoalUjian, { foreignKey: 'id_soalujian', as: 'soal_ujian', onUpdate: 'CASCADE', onDelete: 'CASCADE' });

module.exports = Sumatif;
