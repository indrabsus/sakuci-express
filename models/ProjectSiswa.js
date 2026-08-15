module.exports = (sequelize, DataTypes) => {
  const ProjectSiswa = sequelize.define('ProjectSiswa', {
    id_project: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_siswa: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nama_project: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link_youtube: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    catatan_kajur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    direview_oleh: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    direview_at: {
      type: DataTypes.DATE,
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
    tableName: 'project_siswa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ProjectSiswa.associate = (models) => {
    ProjectSiswa.belongsTo(models.SiswaPpdb, { foreignKey: 'id_siswa', as: 'siswa' });
  };

  return ProjectSiswa;
};
