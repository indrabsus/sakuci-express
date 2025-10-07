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
      id_agenda: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'agenda',
          key: 'id_agenda',
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
    AbsenSiswa.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb' });
    AbsenSiswa.belongsTo(models.Agenda, { foreignKey: 'id_agenda', as: 'agenda' });
  };

  return AbsenSiswa;
};
