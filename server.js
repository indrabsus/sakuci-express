const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // kalau sudah tahu domain frontend-nya, bisa diganti
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ketika client mengirim pesan
  socket.on("chat-message", (msg) => {
    console.log("Message from client:", msg);
    io.emit("chat-message", msg); // kirim ke semua client
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3002, () => {
  console.log("✅ Socket.IO server running on port 3002");
});