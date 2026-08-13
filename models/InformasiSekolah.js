module.exports = (sequelize, DataTypes) => {
  const InformasiSekolah = sequelize.define('InformasiSekolah', {
    id_sekolah: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama_sekolah: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    no_telepon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nama_kepala_sekolah: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nip_kepala_sekolah: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    visi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    misi: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'informasi_sekolah',
    timestamps: false,
    underscored: true,
  });

  return InformasiSekolah;
};
