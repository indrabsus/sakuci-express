module.exports = (sequelize, DataTypes) => {
  const Jadwal = sequelize.define('Jadwal', {
    id_jadwal: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    id_data: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'data_user',
        key: 'id_data',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_kelas: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'kelas_ppdb',
        key: 'id_kelas',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_mapel: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'mata_pelajaran',
        key: 'id_mapel',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    jam_ke: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sampai_ke: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hari: {
      type: DataTypes.STRING,
      allowNull: true,
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
  }, {
    tableName: 'jadwal',
    timestamps: false,
    underscored: true,
  });

  Jadwal.associate = (models) => {
    Jadwal.belongsTo(models.DataUser, {
      foreignKey: 'id_data',
      as: 'guru',
    });
    Jadwal.belongsTo(models.Kelas, {
      foreignKey: 'id_kelas',
      as: 'kelas',
    });
    Jadwal.belongsTo(models.MataPelajaran, {
      foreignKey: 'id_mapel',
      as: 'mapel',
    });
  };

  return Jadwal;
};