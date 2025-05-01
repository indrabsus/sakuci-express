module.exports = (sequelize, DataTypes) => {
  const SiswaBaru = sequelize.define('SiswaBaru', {
    id_siswa_baru: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_kelas: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'siswa_baru',
    timestamps: false,
    underscored: true,
  });

 SiswaBaru.associate = (models) => {
    SiswaBaru.belongsTo(models.KelasPpdb, { foreignKey: 'id_kelas', as: 'kelas_ppdb' });
    SiswaBaru.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb' });
  };

  return SiswaBaru;
};
