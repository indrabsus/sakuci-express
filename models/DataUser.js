const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path ini sesuai dengan konfigurasi database Anda
const User = require('./User'); // Import model User

const DataUser = sequelize.define('DataUser', {
  id_data: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jenkel: {
    type: DataTypes.ENUM('l', 'p'),
    allowNull: false,
  },
  no_rfid: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  uid_fp: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  nama_singkat: {
    type: DataTypes.STRING,
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
  tableName: 'data_user',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});


DataUser.belongsTo(User, {
  foreignKey: 'id_user', as: 'user'
});

module.exports = DataUser;
