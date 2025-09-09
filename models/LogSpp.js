module.exports = (sequelize, DataTypes) => {
  const LogSpp = sequelize.define('LogSpp', {
    id_logspp: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nominal: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    bulan: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    kelas: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bayar: {
      type: DataTypes.ENUM('trf', 'csh'),
      allowNull: false,
    },
    bukti: {
        type: DataTypes.STRING,
        allowNull: true
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
    tableName: 'log_spp',
    timestamps: false,
    underscored: true,
  });

  // Relasi
  LogSpp.associate = (models) => {
    LogSpp.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
  };

  return LogSpp;
};
