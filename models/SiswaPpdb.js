const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sesuaikan dengan konfigurasi database Anda

const SiswaPpdb = sequelize.define('SiswaPpdb', {
  id_siswa: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tempat_lahir: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tanggal_lahir: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  jenkel: {
    type: DataTypes.ENUM('l', 'p'),
    allowNull: false,
  },
  agama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alamat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nisn: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nik_siswa: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nama_ayah: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nama_ibu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  asal_sekolah: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  minat_jurusan1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  minat_jurusan2: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  no_hp: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  tahun: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  bayar_daftar: {
    type: DataTypes.ENUM('y', 'n'),
    allowNull: false,
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
  tableName: 'siswa_ppdb',
  timestamps: true, // Created_at dan updated_at otomatis
  underscored: true, // Menggunakan format snake_case untuk kolom
});

module.exports = SiswaPpdb;
