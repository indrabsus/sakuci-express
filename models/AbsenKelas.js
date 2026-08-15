module.exports = (sequelize, DataTypes) => {
  const AbsenKelas = sequelize.define('AbsenKelas', {
    id_absen_kelas: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_pengajaran: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tanggal: {
      type: DataTypes.DATEONLY,
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
    tableName: 'absen_kelas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  AbsenKelas.associate = (models) => {
    AbsenKelas.belongsTo(models.PembagianMengajar, { foreignKey: 'id_pengajaran', as: 'pengajaran' });
    AbsenKelas.hasMany(models.AbsenKelasDetail, { foreignKey: 'id_absen_kelas', as: 'detail' });
  };

  return AbsenKelas;
};
