// models/agenda.js
module.exports = (sequelize, DataTypes) => {
  const Agenda = sequelize.define('Agenda', {
    id_agenda: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_mapel: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'mata_pelajaran',
        key: 'id_mapel',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_data: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'data_user',
        key: 'id_data',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_kelas: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'kelas_ppdb',
        key: 'id_kelas',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    materi: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tingkat: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    semester: {
      type: DataTypes.ENUM('ganjil', 'genap'),
      allowNull: false,
    },
    tahun_pelajaran: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    penilaian: {
      type: DataTypes.ENUM('y', 'n'),
      allowNull: true,
    },
    jamke: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(255),
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
    tableName: 'agenda',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // 🔗 Relasi
  Agenda.associate = (models) => {
    Agenda.belongsTo(models.MataPelajaran, {
      foreignKey: 'id_mapel',
      as: 'mapel',
    });
    Agenda.belongsTo(models.KelasPpdb, {
      foreignKey: 'id_kelas',
      as: 'kelas',
    });
    Agenda.belongsTo(models.DataUser, {
      foreignKey: 'id_data',
      as: 'guru',
    });
  };

  return Agenda;
};