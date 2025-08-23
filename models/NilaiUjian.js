module.exports = (sequelize, DataTypes) => {
  const NilaiUjian = sequelize.define('NilaiUjian', {
    id_nilaiujian: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    id_sumatif: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_user_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    jawaban_siswa: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    selesai: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'nilai_ujian',
    timestamps: false,
    underscored: true,
  });

  NilaiUjian.associate = (models) => {
    NilaiUjian.belongsTo(models.Sumatif, {
      foreignKey: 'id_sumatif',
      as: 'sumatif',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    NilaiUjian.belongsTo(models.User, {
      foreignKey: 'id_user_siswa',
      as: 'siswa',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return NilaiUjian;
};
