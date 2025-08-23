module.exports = (sequelize, DataTypes) => {
  const TampungSoal = sequelize.define('TampungSoal', {
    id_tampung: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    id_soal: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_soalujian: {
      type: DataTypes.UUID,
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
    tableName: 'tampung_soal',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  TampungSoal.associate = (models) => {
    TampungSoal.belongsTo(models.Soal, {
      as: 'soal',
      foreignKey: 'id_soal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    TampungSoal.belongsTo(models.SoalUjian, {
      as: 'soal_ujian',
      foreignKey: 'id_soalujian',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return TampungSoal;
};
