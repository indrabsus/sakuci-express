module.exports = (sequelize, DataTypes) => {
  const DataTamu = sequelize.define('DataTamu', {
    id_tamu: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jenis: {
      type: DataTypes.ENUM('i', 'u'), // i = internal, u = umum
      allowNull: false,
    },
    asal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jabatan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    keperluan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tujuan: {
      type: DataTypes.STRING,
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
    tableName: 'data_tamu',
    timestamps: false,
    underscored: true,
  });

  DataTamu.associate = (models) => {
    // kalau nanti mau relasi, bisa ditambah di sini
  };

  return DataTamu;
};