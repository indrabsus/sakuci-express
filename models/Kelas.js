module.exports = (sequelize, DataTypes) => {
  const Kelas = sequelize.define('Kelas', {
    id_kelas: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama_kelas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_jurusan: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jurusan',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_angkatan: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'angkatan',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tingkat: {
      type: DataTypes.BIGINT,
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
    tableName: 'kelas',
    timestamps: false,
    underscored: true,
  });

  Kelas.associate = (models) => {
    Kelas.belongsTo(models.Jurusan, { foreignKey: 'id_jurusan', as: 'jurusan' });
    Kelas.belongsTo(models.User, { foreignKey: 'id_user', as: 'user' });
    // Kelas.belongsTo(models.Angkatan, { foreignKey: 'id_angkatan', as: 'angkatan' });
    Kelas.hasMany(models.DataSiswa, { foreignKey: 'id_kelas', as: 'data_siswa' });
    Kelas.hasMany(models.MapelKelas, { foreignKey: 'id_kelas', as: 'mapel_kelas' });
  };

  return Kelas;
};
