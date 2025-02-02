module.exports = (sequelize, DataTypes) => {
  const MasterPpdb = sequelize.define('MasterPpdb', {
    id_ppdb: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // UUID otomatis
    },
    daftar: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ppdb: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    token_telegram: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chat_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tahun: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Default untuk tanggal saat ini
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Default untuk tanggal saat ini
      onUpdate: DataTypes.NOW, // Update otomatis saat data diubah
    },
  }, {
    tableName: 'master_ppdb',
    timestamps: false, // Agar Sequelize tidak otomatis menambahkan field createdAt, updatedAt
    underscored: true, // Menggunakan format snake_case untuk kolom
  });

  return MasterPpdb;
};
