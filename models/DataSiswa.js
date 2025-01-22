// DataSiswa.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Kelas = require('./Kelas');
const User = require('./User');

const DataSiswa = sequelize.define('DataSiswa', {
  id_siswa: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
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
  id_kelas: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'kelas',
      key: 'id_kelas',  // Perbaiki menjadi 'id_kelas'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jenkel: {
    type: DataTypes.ENUM('l', 'p'),
    allowNull: false,
  },
  no_hp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nis: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, 
  },
  no_rfid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
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
  tableName: 'data_siswa',
  timestamps: false,
  underscored: true,
});

// Definisikan Asosiasi
DataSiswa.belongsTo(Kelas, { foreignKey: 'id_kelas', as: 'kelas' });
DataSiswa.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

module.exports = DataSiswa;
