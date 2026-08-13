module.exports = (sequelize, DataTypes) => {
  const RiwayatKelas = sequelize.define('RiwayatKelas', {
    id_riwayat: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'siswa_ppdb',
        key: 'id_siswa',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_tahun_ajaran: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tahun_ajaran',
        key: 'id_tahun_ajaran',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'riwayat_kelas',
    timestamps: false,
    underscored: true,
  });

  RiwayatKelas.associate = (models) => {
    RiwayatKelas.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb' });
    RiwayatKelas.belongsTo(models.TahunAjaran, { foreignKey: 'id_tahun_ajaran', as: 'tahun_ajaran' });
  };

  return RiwayatKelas;
};
