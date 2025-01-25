module.exports = (sequelize, DataTypes) => {
  const SoalUjian = sequelize.define('SoalUjian', {
    id_soalujian: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nama_soal: {
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
    tableName: 'soal_ujian',
    timestamps: false,
    underscored: true,
  });

  SoalUjian.associate = (models) => {
    SoalUjian.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'id_user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return SoalUjian;
};
