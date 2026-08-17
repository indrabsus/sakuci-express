module.exports = (sequelize, DataTypes) => {
  const JawabanTugasSiswa = sequelize.define('JawabanTugasSiswa', {
    id_jawaban: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_pengumpulan: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_soal: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_opsi: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    jawaban_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_benar: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    nilai: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'jawaban_tugas_siswa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  JawabanTugasSiswa.associate = (models) => {
    JawabanTugasSiswa.belongsTo(models.PengumpulanTugas, { foreignKey: 'id_pengumpulan', as: 'pengumpulan' });
    JawabanTugasSiswa.belongsTo(models.BankSoal, { foreignKey: 'id_soal', as: 'soal' });
    JawabanTugasSiswa.belongsTo(models.OpsiJawaban, { foreignKey: 'id_opsi', as: 'opsi' });
  };

  return JawabanTugasSiswa;
};
