module.exports = (sequelize, DataTypes) => {
  const Sumatif = sequelize.define('Sumatif', {
    id_sumatif: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_mapelkelas: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_soalujian: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nama_sumatif: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    waktu: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    tahun: {
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
    tableName: 'sumatif',
    timestamps: false,
    underscored: true,
  });

  Sumatif.associate = (models) => {
    Sumatif.belongsTo(models.MapelKelas, {
      as: 'mapel_kelas',
      foreignKey: 'id_mapelkelas',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Sumatif.belongsTo(models.SoalUjian, {
      as: 'soal_ujian',
      foreignKey: 'id_soalujian',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Sumatif;
};
