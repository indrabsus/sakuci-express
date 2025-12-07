module.exports = (sequelize, DataTypes) => {
  const Dokumen = sequelize.define(
    'Dokumen',
    {
      id_dokumen: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      id_user: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nama_dokumen: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kategori: {
        type: DataTypes.STRING,
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
      tableName: 'dokumen',
      timestamps: false,
      underscored: true,
    }
  );

  Dokumen.associate = (models) => {
    Dokumen.belongsTo(models.User, { foreignKey: 'id_user', as: 'user' });
  };

  return Dokumen;
};