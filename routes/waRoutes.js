const express = require("express");
const proteksi = require("../middleware/authMiddleware");
const apiKeyProteksi = require("../middleware/waApiKeyMiddleware");
const {
  getStatus,
  getChats,
  getMessages,
  sendMessage,
  kirimPesan,
  getMedia,
  logout,
} = require("../controllers/waController");

const router = express.Router();

router.get("/status", proteksi, getStatus);
router.get("/chats", proteksi, getChats);
router.get("/chats/:chatId/messages", proteksi, getMessages);
router.post("/chats/:chatId/messages", proteksi, sendMessage);
router.get("/chats/:chatId/messages/:messageId/media", proteksi, getMedia);
router.post("/logout", proteksi, logout);

// Endpoint server-to-server untuk controller lain (mis. ppdbController, agendaController)
router.post("/kirimpesan", apiKeyProteksi, kirimPesan);

// Endpoint yang sama, untuk dipanggil dari admin panel (login JWT, bukan API key)
router.post("/kirim", proteksi, kirimPesan);

module.exports = router;
