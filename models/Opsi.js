module.exports = (sequelize, DataTypes) => {
  const Opsi = sequelize.define('Opsi', {
    id_opsi: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
    },
    id_soal: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Soal', // Referring to the Soal model
        key: 'id_soal',
      },
      onDelete: 'CASCADE', // Ensures related Opsi records are deleted when a Soal is deleted
    },
    opsi: {
      type: DataTypes.STRING,
      allowNull: false, // Ensures that the option text is required
    },
    opsi_gambar: {
      type: DataTypes.STRING,
      allowNull: true, // Optional image path for the option
    },
    benar: {
      type: DataTypes.TINYINT,
      defaultValue: 0, // Default to '0' meaning the answer is incorrect
      allowNull: false, // Ensures the field always has a value
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set the current timestamp
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set the current timestamp
      onUpdate: DataTypes.NOW, // Automatically update the timestamp when record updates
    },
  }, {
    tableName: 'opsi',
    timestamps: false, // Disable Sequelize's automatic timestamps
  });

  Opsi.associate = (models) => {
    Opsi.belongsTo(models.Soal, {
      foreignKey: 'id_soal',
      as: 'soal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Opsi;
};
