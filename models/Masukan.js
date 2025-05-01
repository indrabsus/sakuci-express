module.exports = (sequelize, DataTypes) => {
  const Masukan = sequelize.define('Masukan', {
    id_masukan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    masukan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    kategori: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gambar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    anonim: {
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
    tableName: 'masukan',
    timestamps: false,
    underscored: true,
  });

  Masukan.associate = (models) => {
    Masukan.belongsTo(models.User, {
      as: 'users',
      foreignKey: 'id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Masukan;
};
