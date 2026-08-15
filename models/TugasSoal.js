module.exports = (sequelize, DataTypes) => {
  const TugasSoal = sequelize.define('TugasSoal', {
    id_tugas_soal: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_tugas: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_soal: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nomor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bobot: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tugas_soal',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  TugasSoal.associate = (models) => {
    TugasSoal.belongsTo(models.Tugas, { foreignKey: 'id_tugas', as: 'tugas' });
    TugasSoal.belongsTo(models.BankSoal, { foreignKey: 'id_soal', as: 'soal' });
  };

  return TugasSoal;
};
