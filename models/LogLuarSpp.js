module.exports = (sequelize, DataTypes) => {
  const LogLuarSpp = sequelize.define('LogLuarSpp', {
    id_logluar: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    keterangan: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nominal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    via: {
      type: DataTypes.ENUM('trf', 'csh'),
      allowNull: false,
    },
    // bukti: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    
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
    tableName: 'log_luar_spp',
    timestamps: false,
    underscored: true,
  });

  return LogLuarSpp;
};
