module.exports = (sequelize, DataTypes) => {
  const MateriAjar = sequelize.define('MateriAjar', {
    id_materi: {
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
    tanggal: {
      type: DataTypes.DATEONLY,
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
    tableName: 'materi_ajar',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  MateriAjar.associate = (models) => {
    MateriAjar.belongsTo(models.PembagianMengajar, { foreignKey: 'id_pengajaran', as: 'pengajaran' });
  };

  return MateriAjar;
};
