const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Menyesuaikan dengan konfigurasi database Anda

const MasterPpdb = require('./MasterPpdb')

const JurusanPpdb = sequelize.define('jurusan_ppdb', {
  id_jurusan: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, // UUID otomatis
  },
  nama_jurusan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_ppdb: {
  type: DataTypes.UUID,
  references: {
    model: MasterPpdb,
    key: 'id_ppdb',
  },
  allowNull: false,
  onDelete: 'CASCADE', // Untuk menghapus data yang terkait jika parent dihapus
  onUpdate: 'CASCADE',
},
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'jurusan_ppdb',
  timestamps: false, // Agar Sequelize tidak otomatis menambahkan field createdAt, updatedAt
});

// Synchronize the model with the database
// If you want to create the table, you can use sequelize.sync() in your main app file
// sequelize.sync({ force: true }); // Uncomment if you want to recreate the table
JurusanPpdb.belongsTo(MasterPpdb, {foreignKey: "id_ppdb", as: "master_ppdb"})

module.exports = JurusanPpdb;
