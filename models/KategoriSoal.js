module.exports = (sequelize, DataTypes) => {
  const KategoriSoal = sequelize.define('KategoriSoal', {
    id_kategori: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_mapel: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'MataPelajaran',  // Nama model yang direferensikan
        key: 'id_mapel',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'User',  // Nama model yang direferensikan
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    nama_kategori: {
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
    tableName: 'kategori_soal',
    timestamps: false,
    underscored: true,
  });

  KategoriSoal.associate = (models) => {
    KategoriSoal.belongsTo(models.MataPelajaran, {
      foreignKey: 'id_mapel',
      as: 'mata_pelajaran',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    KategoriSoal.belongsTo(models.User, {
      foreignKey: 'id_user',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return KategoriSoal;
};
