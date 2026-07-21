module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    staf_boleh_edit_hapus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'settings',
    timestamps: false,
  });

  return Setting;
};
