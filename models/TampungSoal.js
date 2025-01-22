const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sesuaikan dengan konfigurasi database Anda
const Soal = require('./Soal'); // Pastikan model User sudah dibuat
const SoalUjian = require('./SoalUjian'); // Pastikan model User sudah dibuat

const TampungSoal = sequelize.define('TampungSoal', {
  id_tampung: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  id_soal: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  id_soalujian: {
    type: DataTypes.UUID,
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
  tableName: 'tampung_soal',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});
TampungSoal.belongsTo(Soal, { foreignKey: 'id_soal', as: 'soal', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
TampungSoal.belongsTo(SoalUjian, { foreignKey: 'id_soalujian', as: 'soal-ujian', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
module.exports = TampungSoal;
