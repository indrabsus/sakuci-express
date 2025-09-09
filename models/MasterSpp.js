module.exports = (sequelize, DataTypes) => {
  const MasterSpp = sequelize.define('MasterSpp', {
    id_spp: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tahun: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    nominal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    daftar_ulang_11: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    daftar_ulang_12: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    pkl: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    ujian_akhir: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "master_spp",
    timestamps: true, // Sequelize otomatis pakai createdAt & updatedAt
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  return MasterSpp;
};