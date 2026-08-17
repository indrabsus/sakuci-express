module.exports = (sequelize, DataTypes) => {
  const NilaiManualDetail = sequelize.define('NilaiManualDetail', {
    id_detail: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_nilai_manual: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nilai: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'nilai_manual_detail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  NilaiManualDetail.associate = (models) => {
    NilaiManualDetail.belongsTo(models.NilaiManual, { foreignKey: 'id_nilai_manual', as: 'nilai_manual' });
    NilaiManualDetail.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return NilaiManualDetail;
};
