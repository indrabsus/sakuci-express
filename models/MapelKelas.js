module.exports = (sequelize, DataTypes) => {
  const MapelKelas = sequelize.define('MapelKelas', {
    id_mapelkelas: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_mapel: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_kelas: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tahun: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    aktif: {
      type: DataTypes.ENUM('y', 'n'),
      allowNull: false,
      defaultValue: 'y',
    },
    hari: {
      type: DataTypes.STRING,
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
    tableName: 'mapel_kelas',
    timestamps: false,
    underscored: true,
  });

  // Relasi
  MapelKelas.associate = (models) => {
    MapelKelas.belongsTo(models.MataPelajaran, { foreignKey: 'id_mapel', as: 'mata_pelajaran', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
    MapelKelas.belongsTo(models.Kelas, { foreignKey: 'id_kelas', as: 'kelas', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
    MapelKelas.belongsTo(models.User, { foreignKey: 'id_user', as: 'user', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
  };

  return MapelKelas;
};
