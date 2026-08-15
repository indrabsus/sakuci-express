module.exports = (sequelize, DataTypes) => {
  const CatatanSiswa = sequelize.define('CatatanSiswa', {
    id_catatan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipe: {
      type: DataTypes.ENUM('positif', 'negatif'),
      allowNull: false,
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dicatat_oleh: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    nama_pencatat: {
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
    tableName: 'catatan_siswa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  CatatanSiswa.associate = (models) => {
    CatatanSiswa.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return CatatanSiswa;
};
