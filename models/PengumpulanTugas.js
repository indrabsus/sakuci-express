module.exports = (sequelize, DataTypes) => {
  const PengumpulanTugas = sequelize.define('PengumpulanTugas', {
    id_pengumpulan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_tugas: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('dikerjakan', 'selesai', 'dinilai'),
      allowNull: false,
      defaultValue: 'dikerjakan',
    },
    mulai_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    selesai_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nilai: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
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
    tableName: 'pengumpulan_tugas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  PengumpulanTugas.associate = (models) => {
    PengumpulanTugas.belongsTo(models.Tugas, { foreignKey: 'id_tugas', as: 'tugas' });
    PengumpulanTugas.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
    PengumpulanTugas.hasMany(models.JawabanTugasSiswa, { foreignKey: 'id_pengumpulan', as: 'jawaban' });
  };

  return PengumpulanTugas;
};
