module.exports = (sequelize, DataTypes) => {
  const Absen = sequelize.define(
    'Absen',
    {
      id_absen: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      id_user: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      keterangan: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      waktu: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'absen',
      timestamps: false,
      underscored: true,
    }
  );

  Absen.associate = (models) => {
    Absen.belongsTo(models.User, { foreignKey: 'id_user', as: 'users' });
  };

  return Absen;
};
