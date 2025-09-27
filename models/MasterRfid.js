// models/MasterRfid.js
module.exports = (sequelize, DataTypes) => {
  const MasterRfid = sequelize.define('MasterRfid', {
    id_rfid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // UUID otomatis kalau tidak diisi
    },
    kode_mesin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fungsi: {
      type: DataTypes.ENUM('absen', 'spp', 'daftar', 'bank', 'cek', 'agenda'),
      allowNull: false,
    },
    ip_address: {
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
    tableName: 'master_rfid',
    timestamps: false, // biar pakai created_at & updated_at manual
    underscored: true, // pakai snake_case
  });

  return MasterRfid;
};