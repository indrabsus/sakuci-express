module.exports = (sequelize, DataTypes) => {
  const Ujian = sequelize.define('Ujian', {
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
    id_kelas: {
      type: DataTypes.UUID,
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
    tableName: 'ujian',
    timestamps: false,
    underscored: true,
  });

  Ujian.associate = (models) => {
    Ujian.belongsTo(models.Kelas, {
      as: 'kelas',
      foreignKey: 'id_kelas',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Ujian;
};
