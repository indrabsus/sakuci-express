'use strict';
require('dotenv').config();
const sequelize = require('./config/database');

async function createChatTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        sender_avatar VARCHAR(255) NULL,
        receiver_id VARCHAR(50) NULL,
        pesan TEXT NOT NULL,
        lampiran VARCHAR(255) NULL,
        lampiran_tipe VARCHAR(50) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_room (room_id),
        INDEX idx_sender (sender_id),
        INDEX idx_receiver (receiver_id),
        INDEX idx_read (receiver_id, is_read),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabel chat_messages berhasil dibuat / sudah ada.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal membuat tabel chat_messages:', error);
    process.exit(1);
  }
}

createChatTable();
