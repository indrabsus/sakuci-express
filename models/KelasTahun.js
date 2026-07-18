module.exports = (sequelize, DataTypes) => {
  const KelasTahun = sequelize.define('KelasTahun', {
    id_kelas_tahun: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tahun_ajaran: {
      type: DataTypes.STRING,
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
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'kelas_tahun',
    timestamps: false,
    underscored: true,
  });

  return KelasTahun;
};
