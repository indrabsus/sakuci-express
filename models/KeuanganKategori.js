module.exports = (sequelize, DataTypes) => {
  const KeuanganKategori = sequelize.define('KeuanganKategori', {
    id_kategori: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jurusan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nama_kategori: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target_nominal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    target_tingkat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tenggat: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('aktif', 'selesai', 'dibatalkan'),
      allowNull: false,
      defaultValue: 'aktif',
    },
    dibuat_oleh: {
      type: DataTypes.UUID,
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
    tableName: 'keuangan_kategori',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  KeuanganKategori.associate = (models) => {
    KeuanganKategori.hasMany(models.KeuanganPembayaran, { foreignKey: 'id_kategori', as: 'pembayaran' });
  };

  return KeuanganKategori;
};
