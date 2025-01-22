const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ini sesuai
const User = require('./User'); // Import model User

const SoalUjian = sequelize.define('SoalUjian', {
  id_soalujian: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  id_user: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nama_soal: {
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
  tableName: 'soal_ujian',
  timestamps: false,
  underscored: true,
});

// Relasi
SoalUjian.belongsTo(User, { foreignKey: 'id_user', as: 'user', onUpdate: 'CASCADE', onDelete: 'CASCADE' });

module.exports = SoalUjian;
