module.exports = (sequelize, DataTypes) => {
  const JsMenu = sequelize.define('JsMenu', {
    id_menu: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
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
    tableName: 'js_menu',
    timestamps: false,
    underscored: true,
  });
  
  JsMenu.associate = (models) => {
    // Contoh relasi (tambah relasi sesuai kebutuhan)
    JsMenu.hasMany(models.JsSubMenu, { foreignKey: 'id_menu', as: 'sub_menu' });
  };

  return JsMenu;
};
