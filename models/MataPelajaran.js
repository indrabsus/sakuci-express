const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ini sesuai

const MataPelajaran = sequelize.define('MataPelajaran', {
  id_mapel: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  nama_pelajaran: {
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
  tableName: 'mata_pelajaran',
  timestamps: false,
  underscored: true,
});

module.exports = MataPelajaran;
