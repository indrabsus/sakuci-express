module.exports = (sequelize, DataTypes) => {
  const LogAktivitas = sequelize.define('LogAktivitas', {
    id_log: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modul: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aksi: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    data_sebelum: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    data_sesudah: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  }, {
    tableName: 'log_aktivitas',
    timestamps: false,
    underscored: true,
  });

  return LogAktivitas;
};
