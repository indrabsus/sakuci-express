module.exports = (sequelize, DataTypes) => {
  const NilaiManual = sequelize.define('NilaiManual', {
    id_nilai_manual: {
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
    semester: {
      type: DataTypes.ENUM('ganjil', 'genap'),
      allowNull: false,
      defaultValue: 'ganjil',
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
    tableName: 'nilai_manual',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  NilaiManual.associate = (models) => {
    NilaiManual.belongsTo(models.PembagianMengajar, { foreignKey: 'id_pengajaran', as: 'pengajaran' });
    NilaiManual.hasMany(models.NilaiManualDetail, { foreignKey: 'id_nilai_manual', as: 'detail' });
  };

  return NilaiManual;
};
