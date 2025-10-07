// models/Temp.js
module.exports = (sequelize, DataTypes) => {
  const Temp = sequelize.define('Temp', {
    id_temp: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // UUID otomatis
    },
    kode_mesin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_rfid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  }, {
    tableName: 'temps',
    timestamps: false, // karena sudah ada created_at & updated_at
    underscored: true, // snake_case kolom
  });

   Temp.associate = (models) => {
    Temp.belongsTo(models.MasterRfid, { foreignKey: 'kode_mesin', as: 'master_rfid', onUpdate: 'CASCADE', onDelete: 'CASCADE', targetKey: 'kode_mesin', });
  };

  return Temp;
};