module.exports = (sequelize, DataTypes) => {
  const DataUser = sequelize.define('DataUser', {
    id_data: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_user: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // Referensikan nama tabel secara langsung
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    nama_lengkap: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jenkel: {
      type: DataTypes.ENUM('l', 'p'),
      allowNull: false,
    },
    no_rfid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uid_fp: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    nama_singkat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_hp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gambar: {
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
    },
  }, {
    tableName: 'data_user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  DataUser.associate = (models) => {
    DataUser.belongsTo(models.User, { foreignKey: 'id_user', as: 'user' });
    DataUser.hasMany(models.Agenda, {
      foreignKey: 'id_data',
      as: 'agenda',
    });
  };

  return DataUser;
};
