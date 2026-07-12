const waService = require("../whatsapp/waService");

const getStatus = (req, res) => {
  const data = waService.getStatus();
  res.json({ status: "success", data });
};

const getChats = async (req, res) => {
  try {
    const chats = await waService.getChats();
    res.json({ status: "success", data: chats });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const messages = await waService.getMessages(chatId, limit);
    res.json({ status: "success", data: messages });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ status: "error", message: "Pesan tidak boleh kosong." });
    }

    const message = await waService.sendMessage(chatId, body);
    res.json({ status: "success", data: message });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const kirimPesan = async (req, res) => {
  try {
    const { nomor, pesan } = req.body;

    if (!nomor || !pesan || !String(pesan).trim()) {
      return res.status(400).json({ status: "error", message: "nomor dan pesan wajib diisi." });
    }

    const message = await waService.sendMessageToNumber(nomor, pesan);
    res.json({ status: "success", data: message });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const getMedia = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const media = await waService.getMedia(chatId, messageId);
    res.json({ status: "success", data: media });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    await waService.logout();
    res.json({ status: "success", message: "WhatsApp berhasil diputuskan." });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getStatus,
  getChats,
  getMessages,
  sendMessage,
  kirimPesan,
  getMedia,
  logout,
};
