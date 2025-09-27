// models/AbsenHarianSiswa.js
module.exports = (sequelize, DataTypes) => {
  const AbsenHarianSiswa = sequelize.define('AbsenHarianSiswa', {
    id_harian: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // UUID otomatis
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('0', '1', '2', '3', '4'),
      allowNull: false,
    },
    waktu: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'absen_harian_siswa',
    timestamps: false, // biar tidak auto generate createdAt/updatedAt
    underscored: true, // snake_case
  });

  // Relasi ke siswa_ppdb
  AbsenHarianSiswa.associate = (models) => {
    AbsenHarianSiswa.belongsTo(models.SiswaPpdb, {
      foreignKey: 'id_siswa',
      as: 'siswa_ppdb',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return AbsenHarianSiswa;
};