module.exports = (sequelize, DataTypes) => {
  const LogPpdb = sequelize.define('LogPpdb', {
    id_log: {
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
    no_invoice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jenis: {
      type: DataTypes.ENUM('d', 'l', 'p'),
      allowNull: false,
    },
    petugas: {
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
    tableName: 'log_ppdb',
    timestamps: false,
    underscored: true,
  });

  // Relasi
  LogPpdb.associate = (models) => {
    LogPpdb.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa_ppdb', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
  };

  return LogPpdb;
};
