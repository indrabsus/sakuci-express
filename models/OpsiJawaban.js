module.exports = (sequelize, DataTypes) => {
  const OpsiJawaban = sequelize.define('OpsiJawaban', {
    id_opsi: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_soal: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isi_opsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gambar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kategori: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_benar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'opsi_jawaban',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  OpsiJawaban.associate = (models) => {
    OpsiJawaban.belongsTo(models.BankSoal, { foreignKey: 'id_soal', as: 'soal' });
  };

  return OpsiJawaban;
};
