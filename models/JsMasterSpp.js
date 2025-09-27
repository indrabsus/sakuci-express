module.exports = (sequelize, DataTypes) => {
  const JsMasterSpp = sequelize.define('JsMasterSpp', {
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
    spp10: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    spp11: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    spp12: {
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
    tableName: "js_master_spp",
    timestamps: true, // Sequelize otomatis pakai createdAt & updatedAt
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  return JsMasterSpp;
};