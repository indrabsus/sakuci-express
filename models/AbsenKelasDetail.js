module.exports = (sequelize, DataTypes) => {
  const AbsenKelasDetail = sequelize.define('AbsenKelasDetail', {
    id_detail: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_absen_kelas: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('hadir', 'sakit', 'izin', 'alpa'),
      allowNull: false,
      defaultValue: 'hadir',
    },
    keterangan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'absen_kelas_detail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  AbsenKelasDetail.associate = (models) => {
    AbsenKelasDetail.belongsTo(models.AbsenKelas, { foreignKey: 'id_absen_kelas', as: 'absen_kelas' });
    AbsenKelasDetail.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return AbsenKelasDetail;
};
