module.exports = (sequelize, DataTypes) => {
  const BankSoal = sequelize.define('BankSoal', {
    id_soal: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_mapel: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tipe_soal: {
      type: DataTypes.ENUM('pg_tunggal', 'pg_mcma', 'pg_kategori', 'essay'),
      allowNull: false,
      defaultValue: 'pg_tunggal',
    },
    daftar_kategori: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pertanyaan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gambar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tingkat_kesulitan: {
      type: DataTypes.ENUM('mudah', 'sedang', 'sulit'),
      allowNull: false,
      defaultValue: 'sedang',
    },
    pembahasan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dibuat_oleh: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    nama_pembuat: {
      type: DataTypes.STRING,
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
    tableName: 'bank_soal',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  BankSoal.associate = (models) => {
    BankSoal.belongsTo(models.MataPelajaran, { foreignKey: 'id_mapel', as: 'mapel' });
    BankSoal.hasMany(models.OpsiJawaban, { foreignKey: 'id_soal', as: 'opsi' });
  };

  return BankSoal;
};
