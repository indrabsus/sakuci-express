module.exports = (sequelize, DataTypes) => {
  const Sertifikat = sequelize.define('Sertifikat', {
    id_sertifikat: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nomor_sertifikat: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    judul_manual: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jurusan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nilai: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    kode_verifikasi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    diterbitkan_oleh: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    nama_kajur: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('aktif', 'dicabut'),
      allowNull: false,
      defaultValue: 'aktif',
    },
    nama_kepsek: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nip_kepsek: {
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
    tableName: 'sertifikat',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Sertifikat.associate = (models) => {
    Sertifikat.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return Sertifikat;
};
