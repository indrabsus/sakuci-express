module.exports = (sequelize, DataTypes) => {
  const Tugas = sequelize.define('Tugas', {
    id_tugas: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_pengajaran: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    judul: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'terbit'),
      allowNull: false,
      defaultValue: 'draft',
    },
    semester: {
      type: DataTypes.ENUM('ganjil', 'genap'),
      allowNull: false,
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
    tableName: 'tugas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Tugas.associate = (models) => {
    Tugas.belongsTo(models.PembagianMengajar, { foreignKey: 'id_pengajaran', as: 'pengajaran' });
    Tugas.hasMany(models.TugasSoal, { foreignKey: 'id_tugas', as: 'tugas_soal' });
    Tugas.hasMany(models.PengumpulanTugas, { foreignKey: 'id_tugas', as: 'pengumpulan' });
  };

  return Tugas;
};
