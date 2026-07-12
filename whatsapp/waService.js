const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const { EventEmitter } = require("events");
const fs = require("fs/promises");
const path = require("path");

const CLIENT_ID = "admin";
const SESSION_DIR = path.join(process.cwd(), ".wwebjs_auth", `session-${CLIENT_ID}`);

// Versi WhatsApp Web yang diketahui kompatibel dengan whatsapp-web.js,
// diarsipkan dari build resmi WhatsApp oleh wppconnect-team/wa-version.
// Versi live terbaru kadang mengubah struktur modul internal (mis. error
// "Requiring unknown module") sebelum whatsapp-web.js sempat menyesuaikan.
const KNOWN_GOOD_WEB_VERSION = "2.3000.1042650569-alpha";

const emitter = new EventEmitter();

let io = null;
let client = null;
let status = "idle"; // idle | loading | qr | authenticated | ready | disconnected
let qrDataUrl = null;
let info = null;

const broadcast = (event, payload) => {
  if (io) io.of("/wa").emit(event, payload);
};

const setStatus = (next) => {
  status = next;
  emitter.emit("status", status);
  broadcast("status", { status, info });
};

const mapChat = (chat) => ({
  id: chat.id._serialized,
  name: chat.name || chat.id.user,
  isGroup: chat.isGroup,
  unreadCount: chat.unreadCount,
  timestamp: chat.timestamp,
  lastMessage: chat.lastMessage
    ? {
        body: chat.lastMessage.body,
        fromMe: chat.lastMessage.fromMe,
        timestamp: chat.lastMessage.timestamp,
        hasMedia: chat.lastMessage.hasMedia,
      }
    : null,
});

const mapMessage = (message) => ({
  id: message.id._serialized,
  chatId: message.fromMe ? message.to : message.from,
  body: message.body,
  fromMe: message.fromMe,
  timestamp: message.timestamp,
  author: message.author || null,
  hasMedia: message.hasMedia,
  type: message.type,
});

const createClient = () => {
  const c = new Client({
    authStrategy: new LocalAuth({ clientId: CLIENT_ID }),
    puppeteer: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        // /dev/shm sering dibatasi kecil (default ~64MB) di VPS/container,
        // menyebabkan Chromium hang diam-diam saat sinkronisasi chat besar.
        "--disable-dev-shm-usage",
      ],
    },
    // Sumber eksternal dikonfirmasi user: wppconnect-team/wa-version
    // (raw.githubusercontent.com), mengarsipkan build resmi WhatsApp Web.
    webVersion: KNOWN_GOOD_WEB_VERSION,
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
    },
  });

  c.on("qr", async (qr) => {
    qrDataUrl = await qrcode.toDataURL(qr);
    info = null;
    setStatus("qr");
  });

  c.on("authenticated", () => {
    qrDataUrl = null;
    console.log("WA: authenticated, menunggu sinkronisasi (event ready)...");
    setStatus("authenticated");
  });

  c.on("loading_screen", (percent, message) => {
    console.log(`WA: loading_screen ${percent}% - ${message}`);
  });

  c.on("ready", () => {
    qrDataUrl = null;
    info = {
      number: c.info?.wid?.user || null,
      name: c.info?.pushname || null,
    };
    console.log("WA: ready, tersambung sebagai", info.number);
    setStatus("ready");
  });

  c.on("auth_failure", (message) => {
    console.error("WA: auth_failure -", message);
    qrDataUrl = null;
    setStatus("disconnected");
  });

  c.on("disconnected", (reason) => {
    console.log("WA: disconnected -", reason);
    info = null;
    qrDataUrl = null;
    setStatus("disconnected");
  });

  c.on("message", (message) => {
    broadcast("message", mapMessage(message));
  });

  c.on("message_create", (message) => {
    if (message.fromMe) {
      broadcast("message", mapMessage(message));
    }
  });

  return c;
};

const attachIO = (ioInstance) => {
  io = ioInstance;
};

const attachPageDebugLogging = (c, attemptsLeft = 50) => {
  if (c.pupPage) {
    c.pupPage.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        console.log(`WA page console [${msg.type()}]:`, msg.text());
      }
    });
    c.pupPage.on("pageerror", (err) => {
      console.error("WA page error:", err.message);
    });
    c.pupPage.on("requestfailed", (req) => {
      console.error("WA page request failed:", req.url(), "-", req.failure()?.errorText);
    });
    return;
  }

  if (attemptsLeft <= 0) return;
  setTimeout(() => attachPageDebugLogging(c, attemptsLeft - 1), 300);
};

const ensureInitialized = () => {
  if (client) return;

  client = createClient();
  setStatus("loading");
  attachPageDebugLogging(client);
  client.initialize().catch((err) => {
    console.error("WA client failed to initialize:", err.message);
    setStatus("disconnected");
  });
};

const getStatus = () => {
  ensureInitialized();
  return { status, qr: qrDataUrl, info };
};

const getChats = async () => {
  if (!client || status !== "ready") {
    throw new Error("WhatsApp belum terhubung.");
  }

  const chats = await client.getChats();
  return chats.map(mapChat);
};

const getMessages = async (chatId, limit = 50) => {
  if (!client || status !== "ready") {
    throw new Error("WhatsApp belum terhubung.");
  }

  const chat = await client.getChatById(chatId);
  const messages = await chat.fetchMessages({ limit });
  return messages.map(mapMessage);
};

const sendMessage = async (chatId, body) => {
  if (!client || status !== "ready") {
    throw new Error("WhatsApp belum terhubung.");
  }

  const message = await client.sendMessage(chatId, body);
  return mapMessage(message);
};

const formatNoHp = (noHp) => {
  let formatted = String(noHp).replace(/[^0-9]/g, "");

  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.slice(1);
  } else if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }

  return formatted;
};

const waitUntilReady = async (timeoutMs = 20000) => {
  ensureInitialized();

  if (status === "ready") return;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.off("status", onStatus);
      reject(new Error("WhatsApp belum terhubung (timeout). Buka menu WhatsApp Bot dan pastikan sudah terkoneksi/scan QR."));
    }, timeoutMs);

    const onStatus = (next) => {
      if (next === "ready") {
        clearTimeout(timer);
        emitter.off("status", onStatus);
        resolve();
      } else if (next === "disconnected") {
        clearTimeout(timer);
        emitter.off("status", onStatus);
        reject(new Error("WhatsApp terputus. Buka menu WhatsApp Bot untuk menyambungkan ulang."));
      }
    };

    emitter.on("status", onStatus);
  });
};

const sendMessageToNumber = async (noHp, body) => {
  await waitUntilReady();

  const chatId = `${formatNoHp(noHp)}@c.us`;
  const message = await client.sendMessage(chatId, body);
  return mapMessage(message);
};

const getMedia = async (chatId, messageId) => {
  if (!client || status !== "ready") {
    throw new Error("WhatsApp belum terhubung.");
  }

  const chat = await client.getChatById(chatId);
  const messages = await chat.fetchMessages({ limit: 100 });
  const message = messages.find((m) => m.id._serialized === messageId);

  if (!message) {
    throw new Error("Pesan tidak ditemukan.");
  }

  const media = await message.downloadMedia();
  if (!media) {
    throw new Error("Media tidak tersedia.");
  }

  return { mimetype: media.mimetype, data: media.data };
};

const logout = async () => {
  if (!client) return;

  try {
    await client.logout();
  } catch (err) {
    // whatsapp-web.js's LocalAuth tries to delete the Chrome profile folder
    // immediately after logout, before Chromium fully releases its file
    // locks — this routinely fails with ENOTEMPTY/EBUSY even though the
    // account was already unlinked successfully. Clean up below instead.
    console.error("WA logout: sesi terputus tapi gagal hapus folder profil:", err.message);
  }

  try {
    await client.destroy();
  } catch {
    // client may already be torn down by logout(); ignore.
  }

  try {
    await fs.rm(SESSION_DIR, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch (err) {
    console.error("WA logout: gagal membersihkan folder sesi:", err.message);
  }

  client = null;
  info = null;
  qrDataUrl = null;
  setStatus("idle");
};

module.exports = {
  attachIO,
  ensureInitialized,
  getStatus,
  getChats,
  getMessages,
  sendMessage,
  sendMessageToNumber,
  getMedia,
  logout,
};
