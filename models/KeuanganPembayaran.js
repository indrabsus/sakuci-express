module.exports = (sequelize, DataTypes) => {
  const KeuanganPembayaran = sequelize.define('KeuanganPembayaran', {
    id_pembayaran: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_kategori: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nominal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    tanggal_bayar: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.STRING,
      allowNull: true,
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
  }, {
    tableName: 'keuangan_pembayaran',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  KeuanganPembayaran.associate = (models) => {
    KeuanganPembayaran.belongsTo(models.KeuanganKategori, { foreignKey: 'id_kategori', as: 'kategori' });
    KeuanganPembayaran.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return KeuanganPembayaran;
};
