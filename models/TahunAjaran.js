module.exports = (sequelize, DataTypes) => {
  const TahunAjaran = sequelize.define('TahunAjaran', {
    id_tahun_ajaran: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    is_aktif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'tahun_ajaran',
    timestamps: false,
    underscored: true,
  });

  TahunAjaran.associate = (models) => {
    TahunAjaran.hasMany(models.RiwayatKelas, { foreignKey: 'id_tahun_ajaran', as: 'riwayat_kelas' });
  };

  return TahunAjaran;
};
