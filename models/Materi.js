module.exports = (sequelize, DataTypes) => {
  const Materi = sequelize.define('Materi', {
    id_materi: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_mapelkelas: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'MapelKelas',
        key: 'id_mapelkelas',
      },
      onDelete: 'CASCADE',
    },
    materi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    semester: {
      type: DataTypes.ENUM('ganjil', 'genap'),
      allowNull: false,
    },
    tahun_pelajaran: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    penilaian: {
      type: DataTypes.ENUM('y', 'n'),
      allowNull: false,
    },
    tingkatan: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.ENUM('1', '2', '3'),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'materi', // Nama tabel sesuai database
    timestamps: true, // Mengaktifkan createdAt dan updatedAt otomatis
    createdAt: 'created_at', // Gunakan nama kolom custom untuk createdAt
    updatedAt: 'updated_at', // Gunakan nama kolom custom untuk updatedAt
  });

  Materi.associate = (models) => {
    Materi.belongsTo(models.MapelKelas, {
      as: 'mapel_kelas',
      foreignKey: 'id_mapelkelas',
      onDelete: 'CASCADE',
    });
  };

  return Materi;
};
