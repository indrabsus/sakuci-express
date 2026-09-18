const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { ChatMessage, User, DataUser, SiswaPpdb } = require("../models");

let io = null;
// Map to track user online status: userId -> Set of socketIds
const userSockets = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware autentikasi handshake Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Autentikasi gagal: Token tidak disediakan"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;

      // Cari nama lengkap jika belum ada di payload token
      if (!socket.user.nama_lengkap) {
        try {
          const role = String(decoded.role || decoded.nama_role || "").toLowerCase();
          if (role === "siswa") {
            const siswa = await SiswaPpdb.findOne({
              where: { id_siswa: decoded.userId },
              attributes: ["nama_lengkap", "gambar"],
            });
            if (siswa) {
              socket.user.nama_lengkap = siswa.nama_lengkap;
              if (siswa.gambar) socket.user.gambar = siswa.gambar;
            }
          } else {
            const staff = await DataUser.findOne({
              where: { id_user: decoded.userId },
              attributes: ["nama_lengkap", "gambar"],
            });
            if (staff) {
              socket.user.nama_lengkap = staff.nama_lengkap;
              if (staff.gambar) socket.user.gambar = staff.gambar;
            }
          }
        } catch (e) {
          // Abaikan jika query gagal, gunakan fallback username
        }
      }

      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      return next(new Error("Autentikasi gagal: Token tidak valid"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user.userId);
    const userName = socket.user.nama_lengkap || socket.user.username;
    const userRole = socket.user.role || socket.user.nama_role || "user";

    // Simpan koneksi socket user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Gabung room pribadi
    socket.join(`user_${userId}`);

    // Siarkan status online jika ini koneksi pertama user
    if (userSockets.get(userId).size === 1) {
      io.emit("user_status", {
        userId,
        status: "online",
      });
    }

    // Event: minta daftar user yang sedang online
    socket.on("get_online_users", () => {
      const onlineIds = Array.from(userSockets.keys()).filter(
        (id) => userSockets.get(id).size > 0
      );
      socket.emit("online_users_list", onlineIds);
    });

    // Event: kirim pesan realtime
    socket.on("send_message", async (data, callback) => {
      try {
        const { receiverId, pesan, lampiran, lampiranTipe } = data || {};

        if (!receiverId || (!pesan && !lampiran)) {
          if (typeof callback === "function") {
            callback({ ok: false, error: "Penerima dan pesan wajib diisi." });
          }
          return;
        }

        const cleanReceiverId = String(receiverId).trim();
        const roomId = [userId, cleanReceiverId].sort().join("_");

        const newMsg = await ChatMessage.create({
          room_id: roomId,
          sender_id: userId,
          sender_name: userName,
          sender_role: userRole,
          sender_avatar: socket.user.gambar || null,
          receiver_id: cleanReceiverId,
          pesan: (pesan || "").trim(),
          lampiran: lampiran || null,
          lampiran_tipe: lampiranTipe || null,
          is_read: false,
        });

        const msgData = newMsg.toJSON();

        // Kirim ke penerima
        io.to(`user_${cleanReceiverId}`).emit("new_message", msgData);

        // Kirim ke semua device/tab milik pengirim sendiri
        io.to(`user_${userId}`).emit("new_message", msgData);

        if (typeof callback === "function") {
          callback({ ok: true, data: msgData });
        }
      } catch (err) {
        console.error("Error socket send_message:", err);
        if (typeof callback === "function") {
          callback({ ok: false, error: err.message });
        }
      }
    });

    // Event: indikator sedang mengetik
    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data || {};
      if (!receiverId) return;

      io.to(`user_${String(receiverId).trim()}`).emit("user_typing", {
        fromUserId: userId,
        fromUserName: userName,
        isTyping: !!isTyping,
      });
    });

    // Event: tandai pesan sudah dibaca
    socket.on("mark_as_read", async (data) => {
      try {
        const { senderId } = data || {};
        if (!senderId) return;

        const cleanSenderId = String(senderId).trim();
        const now = new Date();

        await ChatMessage.update(
          { is_read: true, read_at: now },
          {
            where: {
              sender_id: cleanSenderId,
              receiver_id: userId,
              is_read: false,
            },
          }
        );

        // Beritahu pengirim asli bahwa pesannya sudah dibaca oleh user saat ini
        io.to(`user_${cleanSenderId}`).emit("messages_read", {
          readBy: userId,
          readAt: now,
        });

        // Perbarui badge unread pada user saat ini
        socket.emit("unread_cleared", {
          senderId: cleanSenderId,
        });
      } catch (err) {
        console.error("Error socket mark_as_read:", err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          io.emit("user_status", {
            userId,
            status: "offline",
          });
        }
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO belum diinisialisasi!");
  }
  return io;
}

function isUserOnline(userId) {
  const cleanId = String(userId);
  return userSockets.has(cleanId) && userSockets.get(cleanId).size > 0;
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
};
