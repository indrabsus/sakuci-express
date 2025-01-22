const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Pastikan path sesuai dengan konfigurasi Anda
const Role = require('./Role');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Otomatis menghasilkan UUID
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  acc: {
    type: DataTypes.ENUM('y', 'n'), // Enum dengan nilai 'y' atau 'n'
    allowNull: false,
    defaultValue: 'n', // Default nilai 'n'
  },
  remember_token: {
    type: DataTypes.STRING,
    allowNull: true, // Bisa null
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Set nilai default sebagai waktu sekarang
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'users', // Pastikan nama tabel sesuai
  timestamps: false, // Karena Anda sudah menentukan `created_at` dan `updated_at`
  underscored: true, // Gunakan format snake_case
});

User.belongsTo(Role, { foreignKey: 'id_role', as: 'role' });

module.exports = User;
