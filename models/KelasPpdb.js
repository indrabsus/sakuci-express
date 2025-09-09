module.exports = (sequelize, DataTypes) => {
  const KelasPpdb = sequelize.define('KelasPpdb', {
    id_kelas: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tingkat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_kelas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_jurusan: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jurusan_ppdb',
        key: 'id_jurusan',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    max: {
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
    tableName: 'kelas_ppdb',
    timestamps: false,
    underscored: true,
  });

//   KelasPpdb.associate = (models) => {
//     KelasPpdb.belongsTo(models.JurusanPpdb, { foreignKey: 'id_jurusan', as: 'jurusan_ppdb' });
//   };

  return KelasPpdb;
};
