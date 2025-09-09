module.exports = (sequelize, DataTypes) => {
  const JsSubMenu = sequelize.define('JsSubMenu', {
    id_sub_menu: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_menu: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'js_menu',
        key: 'id_menu',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    id_role: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'role',
        key: 'id_role',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    sublabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    href: {
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
    tableName: 'js_sub_menu',
    timestamps: false,
    underscored: true,
  });

JsSubMenu.associate = (models) => {
  JsSubMenu.belongsTo(models.Role, {
    foreignKey: 'id_role',
    as: 'role',
  });

  JsSubMenu.belongsTo(models.JsMenu, {
    foreignKey: 'id_menu',
    as: 'menu',
  });
};
  return JsSubMenu;
};
