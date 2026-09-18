const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { ChatMessage, User, DataUser, Role, SiswaPpdb, sequelize } = require("../models");
const { getIO, isUserOnline } = require("../socket/chatSocket");

const UPLOAD_CHAT_DIR = path.join(__dirname, "..", "uploads", "chat");
if (!fs.existsSync(UPLOAD_CHAT_DIR)) {
  fs.mkdirSync(UPLOAD_CHAT_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. DAFTAR PERCAKAPAN AKTIF (CONVERSATIONS)
// -------------------------------------------------------------
const getConversations = async (req, res) => {
  try {
    const myId = String(req.user.userId);

    // Ambil semua pesan terakhir yang melibatkan user saat ini
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [{ sender_id: myId }, { receiver_id: myId }],
      },
      order: [["created_at", "DESC"]],
      limit: 500,
    });

    // Petakan partner chat unik
    const partnerMap = new Map();

    for (const msg of messages) {
      const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
      if (!partnerId) continue;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Hitung unread: pesan dari partner yang ditujukan ke saya dan belum dibaca
      if (msg.sender_id === partnerId && msg.receiver_id === myId && !msg.is_read) {
        partnerMap.get(partnerId).unreadCount += 1;
      }
    }

    const partnerIds = Array.from(partnerMap.keys());
    if (partnerIds.length === 0) {
      return res.status(200).json({
        status: "success",
        data: [],
      });
    }

    // Ambil data profil semua partner (Staff & Siswa)
    const [staffList, siswaList] = await Promise.all([
      User.findAll({
        where: { id: partnerIds },
        include: [
          { model: DataUser, attributes: ["nama_lengkap", "nama_singkat", "gambar"] },
          { model: Role, as: "role", attributes: ["nama_role"] },
        ],
      }),
      SiswaPpdb.findAll({
        where: { id_siswa: partnerIds },
        attributes: ["id_siswa", "nama_lengkap", "username", "gambar"],
      }),
    ]);

    const profileMap = new Map();
    staffList.forEach((s) => {
      profileMap.set(String(s.id), {
        userId: String(s.id),
        nama: s.DataUser?.nama_lengkap || s.username,
        role: s.role?.nama_role || "Staff",
        avatar: s.DataUser?.gambar || null,
      });
    });

    siswaList.forEach((sw) => {
      profileMap.set(String(sw.id_siswa), {
        userId: String(sw.id_siswa),
        nama: sw.nama_lengkap || sw.username,
        role: "Siswa",
        avatar: sw.gambar || null,
      });
    });

    const conversations = [];
    for (const [partnerId, info] of partnerMap.entries()) {
      const profile = profileMap.get(partnerId) || {
        userId: partnerId,
        nama: info.lastMessage.sender_id === partnerId ? info.lastMessage.sender_name : "Pengguna",
        role: info.lastMessage.sender_id === partnerId ? info.lastMessage.sender_role : "Pengguna",
        avatar: info.lastMessage.sender_id === partnerId ? info.lastMessage.sender_avatar : null,
      };

      conversations.push({
        partner: {
          ...profile,
          isOnline: isUserOnline(partnerId),
        },
        lastMessage: {
          id: info.lastMessage.id,
          pesan: info.lastMessage.pesan,
          lampiran: info.lastMessage.lampiran,
          lampiran_tipe: info.lastMessage.lampiran_tipe,
          sender_id: info.lastMessage.sender_id,
          is_read: info.lastMessage.is_read,
          created_at: info.lastMessage.created_at,
        },
        unreadCount: info.unreadCount,
      });
    }

    // Urutkan percakapan berdasarkan waktu pesan terakhir
    conversations.sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    return res.status(200).json({
      status: "success",
      data: conversations,
    });
  } catch (error) {
    console.error("Error getConversations:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar percakapan.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// 2. DAFTAR KONTAK YANG BISA DIAJAK CHAT (GURU & SISWA)
// -------------------------------------------------------------
const getContacts = async (req, res) => {
  try {
    const myId = String(req.user.userId);
    const search = (req.query.q || "").trim();
    const roleFilter = (req.query.role || "").trim().toLowerCase();

    const contacts = [];

    // 1. Ambil Kontak Guru & Staf
    if (!roleFilter || roleFilter !== "siswa") {
      const staffWhere = {
        acc: "y",
        id: { [Op.ne]: myId },
      };

      const staffUsers = await User.findAll({
        where: staffWhere,
        include: [
          {
            model: DataUser,
            attributes: ["nama_lengkap", "nama_singkat", "gambar", "jurusan"],
            where: search
              ? {
                  [Op.or]: [
                    { nama_lengkap: { [Op.like]: `%${search}%` } },
                    { nama_singkat: { [Op.like]: `%${search}%` } },
                  ],
                }
              : undefined,
            required: !!search,
          },
          { model: Role, as: "role", attributes: ["nama_role"] },
        ],
        limit: 100,
      });

      staffUsers.forEach((s) => {
        contacts.push({
          userId: String(s.id),
          nama: s.DataUser?.nama_lengkap || s.username,
          role: s.role?.nama_role || "Staff",
          avatar: s.DataUser?.gambar || null,
          isOnline: isUserOnline(s.id),
        });
      });
    }

    // 2. Ambil Kontak Siswa
    if (!roleFilter || roleFilter === "siswa") {
      const siswaWhere = {
        id_siswa: { [Op.ne]: myId },
      };

      if (search) {
        siswaWhere[Op.or] = [
          { nama_lengkap: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
        ];
      }

      const siswaList = await SiswaPpdb.findAll({
        where: siswaWhere,
        attributes: ["id_siswa", "nama_lengkap", "username", "gambar"],
        limit: 100,
      });

      siswaList.forEach((sw) => {
        contacts.push({
          userId: String(sw.id_siswa),
          nama: sw.nama_lengkap || sw.username,
          role: "Siswa",
          avatar: sw.gambar || null,
          isOnline: isUserOnline(sw.id_siswa),
        });
      });
    }

    // Urutkan kontak secara alfabetis
    contacts.sort((a, b) => a.nama.localeCompare(b.nama));

    return res.status(200).json({
      status: "success",
      data: contacts,
    });
  } catch (error) {
    console.error("Error getContacts:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil daftar kontak.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// 3. RIWAYAT PESAN CHAT 1-ON-1
// -------------------------------------------------------------
const getMessages = async (req, res) => {
  try {
    const myId = String(req.user.userId);
    const otherUserId = String(req.params.otherUserId).trim();

    if (!otherUserId) {
      return res.status(400).json({
        status: "error",
        message: "ID partner chat wajib diisi.",
      });
    }

    const roomId = [myId, otherUserId].sort().join("_");

    // Ambil riwayat chat
    const messages = await ChatMessage.findAll({
      where: { room_id: roomId },
      order: [["created_at", "ASC"]],
      limit: 200,
    });

    // Otomatis tandai pesan dari otherUserId yang ditujukan ke myId sebagai read
    const unreadIds = messages
      .filter((m) => m.sender_id === otherUserId && m.receiver_id === myId && !m.is_read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      const now = new Date();
      await ChatMessage.update(
        { is_read: true, read_at: now },
        { where: { id: unreadIds } }
      );

      // Siarkan lewat socket ke otherUserId
      try {
        const io = getIO();
        io.to(`user_${otherUserId}`).emit("messages_read", {
          readBy: myId,
          readAt: now,
        });
      } catch (e) {
        // Socket belum siap, abaikan
      }
    }

    return res.status(200).json({
      status: "success",
      data: messages,
    });
  } catch (error) {
    console.error("Error getMessages:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil pesan chat.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// 4. KIRIM PESAN CHAT (REST & FILE ATTACHMENT)
// -------------------------------------------------------------
const sendMessage = async (req, res) => {
  try {
    const myId = String(req.user.userId);
    const userName = req.user.nama_lengkap || req.user.username;
    const userRole = req.user.role || req.user.nama_role || "user";
    const avatar = req.user.gambar || null;

    const { receiver_id, pesan } = req.body;
    const cleanReceiverId = String(receiver_id || "").trim();

    if (!cleanReceiverId) {
      return res.status(400).json({
        status: "error",
        message: "Receiver ID wajib diisi.",
      });
    }

    let lampiranPath = null;
    let lampiranTipe = null;

    if (req.file) {
      lampiranPath = `/uploads/chat/${req.file.filename}`;
      if (req.file.mimetype.startsWith("image/")) {
        lampiranTipe = "image";
      } else {
        lampiranTipe = "document";
      }
    }

    if (!pesan && !lampiranPath) {
      return res.status(400).json({
        status: "error",
        message: "Pesan atau lampiran file wajib diisi.",
      });
    }

    const roomId = [myId, cleanReceiverId].sort().join("_");

    const newMsg = await ChatMessage.create({
      room_id: roomId,
      sender_id: myId,
      sender_name: userName,
      sender_role: userRole,
      sender_avatar: avatar,
      receiver_id: cleanReceiverId,
      pesan: (pesan || "").trim(),
      lampiran: lampiranPath,
      lampiran_tipe: lampiranTipe,
      is_read: false,
    });

    const msgData = newMsg.toJSON();

    // Broadcast ke Socket.IO
    try {
      const io = getIO();
      io.to(`user_${cleanReceiverId}`).emit("new_message", msgData);
      io.to(`user_${myId}`).emit("new_message", msgData);
    } catch (e) {
      console.warn("Socket broadcast warning:", e.message);
    }

    return res.status(201).json({
      status: "success",
      data: msgData,
    });
  } catch (error) {
    console.error("Error sendMessage:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengirim pesan.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// 5. TANDAI PESAN TELAH DIBACA (MARK AS READ)
// -------------------------------------------------------------
const markAsRead = async (req, res) => {
  try {
    const myId = String(req.user.userId);
    const otherUserId = String(req.params.otherUserId).trim();
    const now = new Date();

    const [updatedCount] = await ChatMessage.update(
      { is_read: true, read_at: now },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: myId,
          is_read: false,
        },
      }
    );

    try {
      const io = getIO();
      io.to(`user_${otherUserId}`).emit("messages_read", {
        readBy: myId,
        readAt: now,
      });
    } catch (e) {}

    return res.status(200).json({
      status: "success",
      message: `${updatedCount} pesan ditandai telah dibaca.`,
    });
  } catch (error) {
    console.error("Error markAsRead:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal memperbarui status baca pesan.",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// 6. HITUNG TOTAL PESAN UNREAD UNTUK BADGE
// -------------------------------------------------------------
const getUnreadCount = async (req, res) => {
  try {
    const myId = String(req.user.userId);

    const count = await ChatMessage.count({
      where: {
        receiver_id: myId,
        is_read: false,
      },
    });

    return res.status(200).json({
      status: "success",
      data: { unread: count },
    });
  } catch (error) {
    console.error("Error getUnreadCount:", error);
    return res.status(500).json({
      status: "error",
      message: "Gagal mengambil total pesan belum dibaca.",
      error: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getContacts,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
