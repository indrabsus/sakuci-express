module.exports = (sequelize, DataTypes) => {
  const SiswaBaru = sequelize.define('SiswaBaru', {
    id_siswa_baru: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
          model: 'siswa_ppdb',
          key: 'id_siswa'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    id_kelas: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
          model: 'kelas_ppdb',
          key: 'id_kelas'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    tableName: 'siswa_baru',
    timestamps: false,
    underscored: true,
  });
  
//   SiswaBaru.associate = (models) => {
//     // Contoh relasi (tambah relasi sesuai kebutuhan)
//     SiswaBaru.hasMany(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_baru' });
//     SiswaBaru.hasMany(models.KelasPpdb, { foreignKey: 'id_kelas', as: 'kelas_ppdb' });
//   };

 SiswaBaru.associate = (models) => {
    SiswaBaru.belongsTo(models.KelasPpdb, { foreignKey: 'id_kelas', as: 'kelas_ppdb' });
    SiswaBaru.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb' });
  };

  return SiswaBaru;
};
