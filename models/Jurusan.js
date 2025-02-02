module.exports = (sequelize, DataTypes) => {
  const Jurusan = sequelize.define('Jurusan', {
    id_jurusan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama_jurusan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    singkatan: {
      type: DataTypes.STRING,
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
    tableName: 'jurusan',
    timestamps: false,
    underscored: true,
  });

  Jurusan.associate = (models) => {
    // Contoh relasi (tambah relasi sesuai kebutuhan)
    Jurusan.hasMany(models.Kelas, { foreignKey: 'id_jurusan', as: 'kelas' });
  };

  return Jurusan;
};
