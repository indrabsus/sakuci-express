const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


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
        model: 'User', // Nama tabel users di database
        key: 'id',     // Kolom yang dirujuk di tabel users
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
      unique: true, // Menjamin NIS unik
    },
    no_rfid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Menjamin no_rfid unik jika diisi
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
    tableName: 'data_siswa', // Pastikan nama tabel sesuai
  timestamps: false, // Karena Anda sudah menentukan `created_at` dan `updated_at`
  underscored: true, // Gunakan format snake_case
  });

module.exports = DataSiswa;