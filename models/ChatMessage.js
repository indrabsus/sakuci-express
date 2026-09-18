module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    room_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sender_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    sender_avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receiver_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pesan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lampiran: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lampiran_tipe: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  ChatMessage.associate = (models) => {
    // Relationships can be defined if needed
  };

  return ChatMessage;
};
