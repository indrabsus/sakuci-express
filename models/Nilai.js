module.exports = (sequelize, DataTypes) => {
  const Nilai = sequelize.define('Nilai', {
    id_nilai: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_agenda: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nilai: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    tableName: 'nilai',
    timestamps: false,
    underscored: true,
  });

  Nilai.associate = (models) => {
    // Relasi ke tabel Agenda
    Nilai.belongsTo(models.Agenda, {
      foreignKey: 'id_agenda',
      as: 'agenda',
    });

    // Relasi ke tabel Siswa
    Nilai.belongsTo(models.SiswaPpdb, {
      foreignKey: 'id_siswa',
      as: 'siswa',
    });
  };

  return Nilai;
};