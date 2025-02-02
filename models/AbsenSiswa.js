module.exports = (sequelize, DataTypes) => {
  const AbsenSiswa = sequelize.define(
    'AbsenSiswa',
    {
      id_absen: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      id_materi: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'materi',
          key: 'id_materi',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      keterangan: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      waktu: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'absen_siswa',
      timestamps: false,
      underscored: true,
    }
  );

  AbsenSiswa.associate = (models) => {
    AbsenSiswa.belongsTo(models.User, { foreignKey: 'id_user', as: 'user' });
    AbsenSiswa.belongsTo(models.Materi, { foreignKey: 'id_materi', as: 'materi' });
  };

  return AbsenSiswa;
};
