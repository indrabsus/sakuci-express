module.exports = (sequelize, DataTypes) => {
  const TarikDataLog = sequelize.define('TarikDataLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sumber: {
      type: DataTypes.ENUM('manual', 'terjadwal'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sukses', 'gagal'),
      allowNull: false,
    },
    pesan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tarik_data_logs',
    timestamps: false,
  });

  return TarikDataLog;
};
