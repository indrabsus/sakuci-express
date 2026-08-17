module.exports = (sequelize, DataTypes) => {
  const PembagianMengajar = sequelize.define('PembagianMengajar', {
    id_pengajaran: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_mapel: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_tahun_ajaran: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tingkat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_kelas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'pembagian_mengajar',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  PembagianMengajar.associate = (models) => {
    PembagianMengajar.belongsTo(models.MataPelajaran, { foreignKey: 'id_mapel', as: 'mapel' });
    PembagianMengajar.belongsTo(models.TahunAjaran, { foreignKey: 'id_tahun_ajaran', as: 'tahun_ajaran' });
    PembagianMengajar.hasMany(models.MateriAjar, { foreignKey: 'id_pengajaran', as: 'materi' });
    PembagianMengajar.hasMany(models.Tugas, { foreignKey: 'id_pengajaran', as: 'tugas' });
    PembagianMengajar.hasMany(models.NilaiManual, { foreignKey: 'id_pengajaran', as: 'nilai_manual' });
  };

  return PembagianMengajar;
};
