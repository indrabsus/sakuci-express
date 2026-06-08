module.exports = (sequelize, DataTypes) => {
  const UjianSitepat = sequelize.define('UjianSitepat', {
    id_ujian: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    nama_ujian: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    waktu: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    acc: {
      type: DataTypes.ENUM('y', 'n'),
      allowNull: false,
      defaultValue: 'n',
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
    tableName: 'ujian_sitepat',
    timestamps: false,
    underscored: true,
  });


  return UjianSitepat;
};
