module.exports = (sequelize, DataTypes, models) => {
  const JurusanPpdb = sequelize.define('JurusanPpdb', {
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
    tableName: 'jurusan_ppdb',
    timestamps: false, // Agar Sequelize tidak otomatis menambahkan field createdAt, updatedAt
    underscored: true, // Menggunakan format snake_case untuk kolom
  });

  // Relasi dengan MasterPpdb
  JurusanPpdb.associate = (models) => {
    // Contoh relasi (tambah relasi sesuai kebutuhan)
    JurusanPpdb.hasMany(models.MasterPpdb, { foreignKey: 'id_jurusan', as: 'master_ppdb' });
  };

  return JurusanPpdb;
};
