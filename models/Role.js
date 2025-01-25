module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id_role: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    nama_role: {
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
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: 'id_role', as: 'user' });
  };

  return Role;
};
