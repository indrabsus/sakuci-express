module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_role: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    acc: {
      type: DataTypes.ENUM('y', 'n'),
      allowNull: false,
      defaultValue: 'n',
    },
    remember_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: true,
  });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'id_role', as: 'role' });
    User.hasMany(models.MapelKelas, { foreignKey: 'id_user', as: 'mapel_kelas' });
    User.hasMany(models.Absen, { foreignKey: 'id_user', as: 'absen' });
    User.hasOne(models.DataUser, { foreignKey: "id_user" });
  };

  return User;
};
